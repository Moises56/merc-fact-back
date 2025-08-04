import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { MercadosModule } from './api/mercados/mercados.module';
import { LocalesModule } from './api/locales/locales.module';
import { FacturasModule } from './api/facturas/facturas.module';
import { AuditModule } from './api/audit/audit.module';
import { DashboardModule } from './api/dashboard/dashboard.module';
import { ReportesModule } from './api/reportes/reportes.module';
import { SeedModule } from './seed/seed.module';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { ConsultaEcModule } from './consulta-ec/consulta-ec.module';
import { ConsultaIcsModule } from './consulta-ics/consulta-ics.module';
import { HealthModule } from './api/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    MercadosModule,
    LocalesModule,
    FacturasModule,
    AuditModule,
    DashboardModule,
    ReportesModule,
    SeedModule,
    ConsultaEcModule,
    ConsultaIcsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
  ],
})
export class AppModule {}
