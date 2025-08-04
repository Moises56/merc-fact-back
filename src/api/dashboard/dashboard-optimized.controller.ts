import { Controller, Get, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardOptimizedService } from './dashboard-optimized.service';
import { DashboardStatisticsDto, FinancialMetricsDto } from './dto/dashboard-statistics.dto';

@ApiTags('Dashboard Optimizado')
@Controller('dashboard-optimized')
@UseInterceptors(CacheInterceptor)
export class DashboardOptimizedController {
  private readonly logger = new Logger(DashboardOptimizedController.name);
  private memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor(private readonly dashboardService: DashboardOptimizedService) {}

  @Get('statistics')
  @ApiOperation({ summary: 'Obtener estadísticas completas del dashboard (optimizado)' })
  @ApiResponse({ status: 200, description: 'Estadísticas obtenidas exitosamente', type: DashboardStatisticsDto })
  @CacheTTL(300000) // 5 minutos de cache
  async getOptimizedStatistics(): Promise<DashboardStatisticsDto> {
    const startTime = Date.now();
    
    try {
      // Verificar cache en memoria primero
      const cached = this.getFromMemoryCache('full-statistics');
      if (cached) {
        const duration = Date.now() - startTime;
        this.logger.log(`Statistics served from memory cache in ${duration}ms`);
        return cached;
      }

      const statistics = await this.dashboardService.getOptimizedStatistics();
      
      // Guardar en cache de memoria por 2 minutos
      this.setMemoryCache('full-statistics', statistics, 120000);
      
      const duration = Date.now() - startTime;
      this.logger.log(`Optimized statistics generated in ${duration}ms`);
      
      return statistics;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get optimized statistics after ${duration}ms:`, error.message);
      throw error;
    }
  }

  @Get('financial')
  @ApiOperation({ summary: 'Obtener solo métricas financieras (ultra rápido)' })
  @ApiResponse({ status: 200, description: 'Métricas financieras obtenidas', type: FinancialMetricsDto })
  @CacheTTL(180000) // 3 minutos de cache
  async getFinancialOnly(): Promise<FinancialMetricsDto> {
    const startTime = Date.now();
    
    try {
      const cached = this.getFromMemoryCache('financial-only');
      if (cached) {
        const duration = Date.now() - startTime;
        this.logger.log(`Financial metrics served from cache in ${duration}ms`);
        return cached;
      }

      const financial = await this.dashboardService.getFinancialMetricsOnly();
      
      this.setMemoryCache('financial-only', financial, 90000); // 1.5 minutos
      
      const duration = Date.now() - startTime;
      this.logger.log(`Financial metrics generated in ${duration}ms`);
      
      return financial;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get financial metrics after ${duration}ms:`, error.message);
      throw error;
    }
  }

  @Get('quick-counts')
  @ApiOperation({ summary: 'Obtener conteos rápidos (súper optimizado)' })
  @ApiResponse({ status: 200, description: 'Conteos rápidos obtenidos' })
  @CacheTTL(60000) // 1 minuto de cache
  async getQuickCounts() {
    const startTime = Date.now();
    
    try {
      const cached = this.getFromMemoryCache('quick-counts');
      if (cached) {
        const duration = Date.now() - startTime;
        this.logger.log(`Quick counts served from cache in ${duration}ms`);
        return cached;
      }

      const counts = await this.dashboardService.getQuickCounts();
      
      this.setMemoryCache('quick-counts', counts, 30000); // 30 segundos
      
      const duration = Date.now() - startTime;
      this.logger.log(`Quick counts generated in ${duration}ms`);
      
      return counts;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to get quick counts after ${duration}ms:`, error.message);
      throw error;
    }
  }

  @Get('cache/clear')
  @ApiOperation({ summary: 'Limpiar cache del dashboard' })
  @ApiResponse({ status: 200, description: 'Cache limpiado exitosamente' })
  async clearCache() {
    this.memoryCache.clear();
    this.logger.log('Dashboard cache cleared manually');
    return { message: 'Cache limpiado exitosamente', timestamp: new Date().toISOString() };
  }

  @Get('cache/status')
  @ApiOperation({ summary: 'Ver estado del cache' })
  @ApiResponse({ status: 200, description: 'Estado del cache' })
  async getCacheStatus() {
    const cacheEntries = Array.from(this.memoryCache.entries()).map(([key, value]) => ({
      key,
      size: JSON.stringify(value.data).length,
      created: new Date(value.timestamp).toISOString(),
      ttl: value.ttl,
      expires: new Date(value.timestamp + value.ttl).toISOString(),
      expired: Date.now() > (value.timestamp + value.ttl)
    }));

    return {
      total_entries: this.memoryCache.size,
      entries: cacheEntries,
      memory_usage_estimate: cacheEntries.reduce((sum, entry) => sum + entry.size, 0)
    };
  }

  // Métodos privados para manejo de cache en memoria
  private getFromMemoryCache(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    // Verificar si expiró
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setMemoryCache(key: string, data: any, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Limpiar cache expirado cada vez que agregamos algo nuevo
    this.cleanExpiredCache();
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now > value.timestamp + value.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }
}