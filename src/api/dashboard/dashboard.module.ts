import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardOptimizedController } from './dashboard-optimized.controller';
import { DashboardOptimizedService } from './dashboard-optimized.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 minutos por defecto
      max: 100, // máximo 100 elementos en cache
    }),
  ],
  controllers: [DashboardController, DashboardOptimizedController],
  providers: [DashboardService, DashboardOptimizedService],
  exports: [DashboardService, DashboardOptimizedService],
})
export class DashboardModule {}
