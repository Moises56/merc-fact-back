import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { UserStatsService } from '../../api/user-stats/user-stats.service';
import {
  ConsultaType,
  ConsultaSubtype,
  ConsultaResultado,
} from '../../api/user-stats/dto/consulta-log.dto';

@Injectable()
export class ConsultaLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConsultaLogInterceptor.name);

  constructor(private readonly userStatsService: UserStatsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // Extraer información del request
    const user = request.user;
    
    // Obtener la IP real del cliente y limpiar el formato IPv6 mapeado
    const rawIp = request.ip || request.connection.remoteAddress;
    // Eliminar el prefijo ::ffff: que aparece cuando una IPv4 se mapea a formato IPv6
    const ip = rawIp?.replace(/^::ffff:/, '') || rawIp;
    
    const userAgent = request.headers['user-agent'];
    const path = request.route?.path || request.url;
    const method = request.method;
    const body = request.body;
    const query = request.query;
    
    // Combinar body y query parameters para capturar todos los parámetros
    const parametros = { ...body, ...query };
    
    // Extraer clave de consulta (claveCatastral, dni o ics)
    const consultaKey = parametros.claveCatastral || parametros.dni || parametros.ics || null;

    // Determinar tipo de consulta basado en la ruta
    let consultaType: ConsultaType | null = null;
    let consultaSubtype: ConsultaSubtype = ConsultaSubtype.NORMAL;

    this.logger.debug(`🔍 ConsultaLogInterceptor - Path: ${path}, Method: ${method}, Parametros: ${JSON.stringify(parametros)}`);

    if (path?.includes('/consultaEC') || path?.includes('estado-cuenta')) {
      consultaType = ConsultaType.EC;
      if (path?.includes('amnistia') || parametros?.amnistia) {
        consultaSubtype = ConsultaSubtype.AMNISTIA;
      }
      this.logger.debug(`✅ Detectado consultaType: EC, subtype: ${consultaSubtype}`);
    } else if (path?.includes('/consultaICS')) {
      consultaType = ConsultaType.ICS;
      if (path?.includes('amnistia') || parametros?.amnistia) {
        consultaSubtype = ConsultaSubtype.AMNISTIA;
      }
      this.logger.debug(`✅ Detectado consultaType: ICS, subtype: ${consultaSubtype}`);
    } else {
      this.logger.debug(`❌ No se detectó tipo de consulta para path: ${path}`);
    }

    // Solo procesar si es una consulta de EC o ICS y hay usuario autenticado
    if (!consultaType || !user?.id) {
      this.logger.debug(`❌ No se procesará: consultaType=${consultaType}, userId=${user?.id}`);
      return next.handle();
    }

    this.logger.debug(`🚀 Procesando consulta ${consultaType} para usuario ${user.id}`);

    return next.handle().pipe(
      tap((response) => {
        // Consulta exitosa
        const duracionMs = Date.now() - startTime;
        
        let totalEncontrado: number | undefined = undefined;
        let resultado = ConsultaResultado.SUCCESS;

        // Extraer información del response
        if (response) {
          if (response.totalAPagarNumerico !== undefined) {
            totalEncontrado = response.totalAPagarNumerico;
          } else if (response.totalGeneralNumerico !== undefined) {
            totalEncontrado = response.totalGeneralNumerico;
          }
          
          // Si no se encontraron datos
          if (response.success === false || response.totalGeneral === 'L 0.00') {
            resultado = ConsultaResultado.NOT_FOUND;
          }
        }

        this.logger.debug(`📊 Logging consulta exitosa: ${consultaType}, resultado: ${resultado}, total: ${totalEncontrado}`);

        this.logConsulta({
          consultaType,
          consultaSubtype,
          parametros: JSON.stringify(parametros),
          resultado,
          totalEncontrado,
          ip,
          userAgent,
          duracionMs,
          userId: user.id,
          consultaKey,
        });
      }),
      catchError((error) => {
        // Consulta con error
        const duracionMs = Date.now() - startTime;
        
        this.logger.debug(`❌ Logging consulta con error: ${consultaType}, error: ${error.message}`);
        
        this.logConsulta({
          consultaType: consultaType!,
          consultaSubtype,
          parametros: JSON.stringify(parametros),
          resultado: ConsultaResultado.ERROR,
          errorMessage: error.message,
          ip,
          userAgent,
          duracionMs,
          userId: user.id,
          consultaKey,
        });

        throw error;
      }),
    );
  }

  private async logConsulta(data: {
    consultaType: ConsultaType;
    consultaSubtype: ConsultaSubtype;
    parametros: string;
    resultado: ConsultaResultado;
    totalEncontrado?: number;
    errorMessage?: string;
    ip?: string;
    userAgent?: string;
    duracionMs: number;
    userId: string;
    consultaKey?: string;
  }) {
    try {
      this.logger.debug(`💾 Guardando log en base de datos...`);
      await this.userStatsService.logConsulta(data);
      this.logger.debug(`✅ Log guardado exitosamente`);
    } catch (error) {
      this.logger.error(`❌ Error al registrar log de consulta: ${error.message}`, error.stack);
    }
  }
}
