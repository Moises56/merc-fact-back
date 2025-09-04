import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../api/audit/audit.service';

export const AUDIT_LOG = 'auditLog';

export interface AuditLogOptions {
  action: string;
  table: string;
  skipLog?: boolean;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG,
      context.getHandler(),
    );

    if (!auditOptions || auditOptions.skipLog) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    
    // Extraer datos básicos del request
    const { user, body, params, method, headers } = request;
    
    // Obtener la IP real del cliente y limpiar el formato IPv6 mapeado
    const rawIp = request.ip || request.connection.remoteAddress;
    // Eliminar el prefijo ::ffff: que aparece cuando una IPv4 se mapea a formato IPv6
    const ip = rawIp?.replace(/^::ffff:/, '') || rawIp;

    // Extraer userId correctamente del JWT payload
    let userId = user?.userId || user?.sub || user?.id || null;
    
    // Para el endpoint de login, obtener el userId del resultado
    if (auditOptions.action === 'LOGIN' && !userId) {
      // En este caso, obtendremos el userId del resultado del login
      userId = 'pending'; // Marcador temporal
    }
    
    // Log para debug
    console.log('🔍 Audit Debug - User:', user);
    console.log(
      `🔍 Audit Debug - UserId extracted: ${userId}, Action: ${auditOptions.action}, Table: ${auditOptions.table}`,
    );

    // Si no hay usuario autenticado y no es LOGIN, no hacer logging
    if (!userId && auditOptions.action !== 'LOGIN') {
      console.log(
        `⚠️ Skipping audit log - No authenticated user for action: ${auditOptions.action}`,
      );
      return next.handle();
    }

    // Capturar datos antes de la operación (limitando tamaño)
    const beforeData =
      method === 'PUT' || method === 'PATCH'
        ? this.limitDataSize(body)
        : null;

    return next.handle().pipe(
      tap({
        next: (result) => {
          // Para LOGIN, obtener userId del resultado
          let finalUserId = userId;
          if (auditOptions.action === 'LOGIN' && result?.user?.id) {
            finalUserId = result.user.id;
          }
          
          // Log exitoso solo si tenemos un userId válido
          if (finalUserId && finalUserId !== 'pending') {
            void this.logAuditAction(
              finalUserId,
              auditOptions.action,
              auditOptions.table,
              (params?.id as string) || (result?.id as string),
              beforeData,
              this.limitDataSize(result),
              ip as string,
              (headers?.['user-agent'] as string) || '',
            );
          }
        },

        error: (error: any) => {
          // Log de error
          void this.logAuditAction(
            userId || 'anonymous',
            `${auditOptions.action}_ERROR`,
            auditOptions.table,
            params?.id as string,
            beforeData,
            { error: error?.message || 'Unknown error' },
            ip as string,
            (headers?.['user-agent'] as string) || '',
          );
        },
      }),
    );
  }

  private limitDataSize(data: any): any {
    if (!data) return data;
    
    const dataString = JSON.stringify(data);
    const maxSize = 1000; // Limit to 1000 characters
    
    if (dataString.length > maxSize) {
      return JSON.stringify(data).substring(0, maxSize) + '... [truncated]';
    }
    
    return data;
  }

  private async logAuditAction(
    userId: string,
    action: string,
    table: string,
    recordId?: string,
    beforeData?: any,
    afterData?: any,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      await this.auditService.logAction(
        userId,
        action,
        table,
        recordId,
        beforeData,
        afterData,
        ip,
        userAgent,
      );
    } catch (error) {
      // Silently fail to avoid breaking the main operation
      console.error('Failed to log audit action:', error);
    }
  }
}
