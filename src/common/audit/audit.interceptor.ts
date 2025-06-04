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
    const { user, body, params, method, ip, headers } = request;

    // Capturar datos antes de la operación

    const beforeData = method === 'PUT' || method === 'PATCH' ? body : null;

    return next.handle().pipe(
      tap({
        next: (result) => {
          // Log exitoso
          this.logAuditAction(
            (user?.sub as string) || 'anonymous',
            auditOptions.action,
            auditOptions.table,
            (params?.id as string) || (result?.id as string),
            beforeData,
            result,
            ip as string,
            headers?.['user-agent'] as string,
          );
        },

        error: (error: any) => {
          // Log de error
          this.logAuditAction(
            (user?.sub as string) || 'anonymous',
            `${auditOptions.action}_ERROR`,
            auditOptions.table,
            params?.id as string,
            beforeData,
            { error: error?.message || 'Unknown error' },
            ip as string,
            headers?.['user-agent'] as string,
          );
        },
      }),
    );
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
