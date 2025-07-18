import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('Reportes - Demo Público')
@Controller('api/reportes-demo')
export class ReportesDemoController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Test público sin autenticación',
    description: 'Verificar conectividad básica',
  })
  async testPublico() {
    return {
      success: true,
      message: 'API de Reportes Demo funcionando',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints: [
        'GET /reportes-demo/test',
        'GET /reportes-demo/configuracion',
        'GET /reportes-demo/stats',
      ],
    };
  }

  @Get('configuracion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Configuración pública para la app Ionic',
    description: 'Datos de configuración sin autenticación',
  })
  async obtenerConfiguracionPublica() {
    try {
      const [mercados, tiposLocal] = await Promise.all([
        this.prisma.mercado.findMany({
          where: { isActive: true },
          select: {
            id: true,
            nombre_mercado: true,
            direccion: true,
            _count: {
              select: { locales: true },
            },
          },
        }),
        this.prisma.local.findMany({
          select: { tipo_local: true },
          distinct: ['tipo_local'],
          where: { tipo_local: { not: null } },
        }),
      ]);

      return {
        success: true,
        configuracion: {
          tipos_reporte: [
            {
              value: 'FINANCIERO',
              label: 'Reporte Financiero',
              icon: 'cash-outline',
            },
            {
              value: 'OPERACIONAL',
              label: 'Reporte Operacional',
              icon: 'analytics-outline',
            },
            {
              value: 'MERCADO',
              label: 'Por Mercado',
              icon: 'business-outline',
            },
            {
              value: 'LOCAL',
              label: 'Por Local',
              icon: 'storefront-outline',
            },
          ],
          periodos: [
            { value: 'MENSUAL', label: 'Mensual' },
            { value: 'TRIMESTRAL', label: 'Trimestral' },
            { value: 'ANUAL', label: 'Anual' },
          ],
          formatos: [
            { value: 'JSON', label: 'Vista Previa', icon: 'eye-outline' },
            { value: 'PDF', label: 'PDF', icon: 'document-text-outline' },
            { value: 'EXCEL', label: 'Excel', icon: 'grid-outline' },
          ],
          mercados_disponibles: mercados,
          tipos_local: tiposLocal.map((t) => t.tipo_local).filter(Boolean),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error obteniendo configuración',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Estadísticas básicas públicas',
    description: 'Estadísticas generales del sistema',
  })
  async obtenerEstadisticasPublicas() {
    try {
      const [
        totalMercados,
        totalLocales,
        totalFacturas,
        estadisticasFacturas,
      ] = await Promise.all([
        this.prisma.mercado.count({ where: { isActive: true } }),
        this.prisma.local.count(),
        this.prisma.factura.count(),
        this.prisma.factura.aggregate({
          _sum: { monto: true },
          _avg: { monto: true },
        }),
      ]);

      return {
        success: true,
        estadisticas: {
          total_mercados: totalMercados,
          total_locales: totalLocales,
          total_facturas: totalFacturas,
          total_recaudado: Number(estadisticasFacturas._sum?.monto) || 0,
          promedio_factura: Number(estadisticasFacturas._avg?.monto) || 0,
        },
        sistema: {
          status: 'online',
          version: '1.0.0',
          ambiente: process.env.NODE_ENV || 'development',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Error obteniendo estadísticas',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
