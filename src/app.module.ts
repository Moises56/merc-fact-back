import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { SeedModule } from './seed/seed.module';

@Module({  imports: [
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
    SeedModule,
  ],  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
