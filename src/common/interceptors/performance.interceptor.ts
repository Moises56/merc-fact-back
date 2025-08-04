import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          
          // Log todas las requests con su duración
          this.logger.log(
            `${method} ${url} - ${duration}ms - IP: ${ip}`
          );

          // Alertar sobre consultas lentas
          if (duration > 5000) {
            this.logger.error(
              `🐌 VERY SLOW REQUEST: ${method} ${url} - ${duration}ms - UserAgent: ${userAgent}`
            );
          } else if (duration > 2000) {
            this.logger.warn(
              `⚠️ SLOW REQUEST: ${method} ${url} - ${duration}ms`
            );
          }

          // Log específico para endpoints críticos
          if (url.includes('/dashboard') && duration > 1000) {
            this.logger.warn(
              `📊 Dashboard slow: ${duration}ms - Consider caching`
            );
          }

          if (url.includes('/consulta-') && duration > 10000) {
            this.logger.error(
              `🔍 External query timeout risk: ${url} - ${duration}ms`
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error(
            `❌ ERROR: ${method} ${url} - ${duration}ms - ${error.message}`
          );
        },
      })
    );
  }
}