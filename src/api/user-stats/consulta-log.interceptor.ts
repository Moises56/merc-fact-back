import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { UserStatsService } from './user-stats.service';
import {
  ConsultaType,
  ConsultaSubtype,
  ConsultaResultado,
} from './dto/consulta-log.dto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

@Injectable()
export class ConsultaLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConsultaLogInterceptor.name);

  constructor(private readonly userStatsService: UserStatsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const startTime = Date.now();

    // Determinar tipo de consulta basado en la URL
    const url = request.url;
    let consultaType: ConsultaType | null = null;
    let consultaSubtype: ConsultaSubtype = ConsultaSubtype.NORMAL;

    if (url.includes('/consulta-ec')) {
      consultaType = ConsultaType.EC;
      if (url.includes('amnistia')) {
        consultaSubtype = ConsultaSubtype.AMNISTIA;
      }
    } else if (url.includes('/consulta-ics')) {
      consultaType = ConsultaType.ICS;
      if (url.includes('amnistia')) {
        consultaSubtype = ConsultaSubtype.AMNISTIA;
      }
    }

    // Solo interceptar consultas EC/ICS
    if (!consultaType || !request.user) {
      return next.handle();
    }

    // Capturar parámetros de la consulta
    const parametros = JSON.stringify({
      body: request.body,
      query: request.query,
      params: request.params,
    });

    return next.handle().pipe(
      tap(async (data) => {
        const duracionMs = Date.now() - startTime;
        
        try {
          // Determinar si fue exitoso y extraer total si está disponible
          let resultado = ConsultaResultado.SUCCESS;
          let totalEncontrado: number | undefined;

          if (data && typeof data === 'object') {
            // Buscar campos que indiquen el total recaudado
            if (data.totalAPagar || data.totalGeneral) {
              const totalString = data.totalAPagar || data.totalGeneral;
              if (typeof totalString === 'string' && totalString.includes('L ')) {
                totalEncontrado = parseFloat(totalString.replace('L ', '').replace(/,/g, ''));
              }
            } else if (data.totalAPagarNumerico || data.totalGeneralNumerico) {
              totalEncontrado = data.totalAPagarNumerico || data.totalGeneralNumerico;
            }

            // Si no se encontraron registros
            if (data.detallesMora && Array.isArray(data.detallesMora) && data.detallesMora.length === 0) {
              resultado = ConsultaResultado.NOT_FOUND;
            } else if (data.empresas && Array.isArray(data.empresas) && data.empresas.length === 0) {
              resultado = ConsultaResultado.NOT_FOUND;
            }
          }

          await this.userStatsService.logConsulta({
            consultaType: consultaType!,
            consultaSubtype,
            parametros,
            resultado,
            totalEncontrado,
            ip: this.getClientIp(request),
            userAgent: request.get('User-Agent'),
            duracionMs,
            userId: request.user!.id,
          });

        } catch (error) {
          this.logger.error(`Error al registrar log de consulta: ${error.message}`, error.stack);
        }
      }),
      catchError(async (error) => {
        const duracionMs = Date.now() - startTime;
        
        try {
          await this.userStatsService.logConsulta({
            consultaType: consultaType!,
            consultaSubtype,
            parametros,
            resultado: ConsultaResultado.ERROR,
            errorMessage: error.message || 'Error desconocido',
            ip: this.getClientIp(request),
            userAgent: request.get('User-Agent'),
            duracionMs,
            userId: request.user!.id,
          });
        } catch (logError) {
          this.logger.error(`Error al registrar log de error: ${logError.message}`, logError.stack);
        }

        throw error;
      }),
    );
  }

  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}
