import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReadonlyDatabaseService } from '../../consulta-ec/readonly-database.service';

interface HealthCheckResult {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  responseTime: number;
  services: {
    mainDatabase: {
      status: 'ok' | 'error';
      responseTime: number;
      error?: string;
    };
    readonlyDatabase: {
      status: 'ok' | 'error';
      responseTime: number;
      error?: string;
    };
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    nodeVersion: string;
  };
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly readonlyDb: ReadonlyDatabaseService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const overallStart = Date.now();
    
    // Test main database
    const mainDbResult = await this.testMainDatabase();
    
    // Test readonly database
    const readonlyDbResult = await this.testReadonlyDatabase();
    
    // Get system info
    const systemInfo = this.getSystemInfo();
    
    // Determine overall status
    let overallStatus: 'ok' | 'error' | 'degraded' = 'ok';
    
    if (mainDbResult.status === 'error' || readonlyDbResult.status === 'error') {
      overallStatus = 'error';
    } else if (mainDbResult.responseTime > 2000 || readonlyDbResult.responseTime > 2000) {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - overallStart,
      services: {
        mainDatabase: mainDbResult,
        readonlyDatabase: readonlyDbResult,
      },
      system: systemInfo,
    };

    // Log health check results
    if (overallStatus === 'error') {
      this.logger.error(`Health check failed: ${JSON.stringify(result)}`);
    } else if (overallStatus === 'degraded') {
      this.logger.warn(`Health check degraded: ${JSON.stringify(result)}`);
    } else {
      this.logger.log(`Health check OK - Response time: ${result.responseTime}ms`);
    }

    return result;
  }

  @Get('quick')
  async quickCheck() {
    const start = Date.now();
    
    try {
      // Quick test - just check if services are responsive
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]);
      
      return {
        status: 'ok',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  @Get('detailed')
  async detailedCheck() {
    const start = Date.now();
    
    try {
      // Detailed checks with actual data queries
      const [userCount, mercadoCount, facturaCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.mercado.count(),
        this.prisma.factura.count(),
      ]);

      return {
        status: 'ok',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        data: {
          users: userCount,
          mercados: mercadoCount,
          facturas: facturaCount,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - start,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  private async testMainDatabase() {
    const start = Date.now();
    
    try {
      await this.prisma.$queryRaw`SELECT 1 as test`;
      
      return {
        status: 'ok' as const,
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'error' as const,
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }

  private async testReadonlyDatabase() {
    const start = Date.now();
    
    try {
      await this.readonlyDb.executeQuery('SELECT 1 as test');
      
      return {
        status: 'ok' as const,
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'error' as const,
        responseTime: Date.now() - start,
        error: error.message,
      };
    }
  }

  private getSystemInfo() {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    
    return {
      uptime: Date.now() - this.startTime,
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round((usedMemory / totalMemory) * 100),
      },
      nodeVersion: process.version,
    };
  }
}