import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Role } from '../../common/enums';
import { PrismaService } from '../../common/prisma/prisma.service';

// Metadatos para marcar endpoints públicos
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Enums para validación
enum TipoReporte {
  FINANCIERO = 'FINANCIERO',
  OPERACIONAL = 'OPERACIONAL',
  MERCADO = 'MERCADO',
  LOCAL = 'LOCAL',
}

enum PeriodoReporte {
  MENSUAL = 'MENSUAL',
  TRIMESTRAL = 'TRIMESTRAL',
  ANUAL = 'ANUAL',
}

enum FormatoReporte {
  JSON = 'JSON',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

// DTO con validaciones
export class GenerarReporteBasicoDto {
  @ApiProperty({
    description: 'Tipo de reporte a generar',
    enum: TipoReporte,
    example: 'FINANCIERO',
  })
  @IsEnum(TipoReporte, {
    message: 'Tipo debe ser: FINANCIERO, OPERACIONAL, MERCADO o LOCAL',
  })
  tipo: TipoReporte;

  @ApiProperty({
    description: 'Período del reporte',
    enum: PeriodoReporte,
    example: 'MENSUAL',
  })
  @IsEnum(PeriodoReporte, {
    message: 'Período debe ser: MENSUAL, TRIMESTRAL o ANUAL',
  })
  periodo: PeriodoReporte;

  @ApiProperty({
    description: 'Formato de salida del reporte',
    enum: FormatoReporte,
    example: 'JSON',
    required: false,
  })
  @IsOptional()
  @IsEnum(FormatoReporte, {
    message: 'Formato debe ser: JSON, PDF, EXCEL o CSV',
  })
  formato?: FormatoReporte;

  @ApiProperty({
    description: 'Fecha de inicio para reporte personalizado (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Fecha de inicio debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fechaInicio?: string;

  @ApiProperty({
    description: 'Fecha de fin para reporte personalizado (YYYY-MM-DD)',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Fecha de fin debe ser una fecha válida (YYYY-MM-DD)' },
  )
  fechaFin?: string;

  @ApiProperty({
    description: 'IDs de mercados a incluir en el reporte',
    type: [String],
    example: ['mercado-1', 'mercado-2'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Mercados debe ser un array' })
  @IsString({ each: true, message: 'Cada mercado debe ser un string' })
  mercados?: string[];

  @ApiProperty({
    description: 'IDs de locales a incluir en el reporte',
    type: [String],
    example: ['local-1', 'local-2'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Locales debe ser un array' })
  @IsString({ each: true, message: 'Cada local debe ser un string' })
  locales?: string[];
}

@ApiTags('Reportes - Version Básica')
@Controller('api/reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportesBasicController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('generar')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'GENERAR_REPORTE_BASICO', table: 'reportes' })
  @ApiOperation({
    summary: 'Generar reporte básico para Ionic',
    description: 'Versión simplificada funcionando para integración inmediata',
  })
  @ApiResponse({ status: 200, description: 'Reporte generado exitosamente' })
  async generarReporte(
    @Body() dto: GenerarReporteBasicoDto,
    @Request() req: any,
  ) {
    try {
      const startTime = Date.now();

      // Construir filtros de fecha
      let fechaInicio: Date;
      let fechaFin: Date;

      if (dto.fechaInicio && dto.fechaFin) {
        fechaInicio = new Date(dto.fechaInicio);
        fechaFin = new Date(dto.fechaFin);
      } else {
        // Usar mes actual por defecto
        const now = new Date();
        fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
        fechaFin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }

      const whereCondition: any = {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      };

      // Aplicar filtros adicionales
      if (dto.mercados?.length) {
        whereCondition.local = {
          mercadoId: { in: dto.mercados },
        };
      }

      if (dto.locales?.length) {
        whereCondition.localId = { in: dto.locales };
      }

      // Obtener datos básicos según el tipo
      let reporteData: any = {};

      switch (dto.tipo) {
        case TipoReporte.FINANCIERO:
          reporteData = await this.generarReporteFinanciero(whereCondition);
          break;
        case TipoReporte.OPERACIONAL:
          reporteData = await this.generarReporteOperacional(whereCondition);
          break;
        case TipoReporte.MERCADO:
          reporteData = await this.generarReportePorMercado(whereCondition);
          break;
        case TipoReporte.LOCAL:
          reporteData = await this.generarReportePorLocal(whereCondition);
          break;
        default:
          reporteData = await this.generarReporteFinanciero(whereCondition);
      }

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: reporteData,
        metadata: {
          tipo: dto.tipo,
          periodo: {
            inicio: fechaInicio,
            fin: fechaFin,
          },
          formato: dto.formato || 'JSON',
          tiempo_procesamiento: `${processingTime}ms`,
          timestamp: new Date().toISOString(),
          usuario: req.user.username,
        },
        filtros_aplicados: {
          mercados: dto.mercados || [],
          locales: dto.locales || [],
        },
      };
    } catch (error) {
      console.error('Error generando reporte:', error);
      return {
        success: false,
        error: error.message || 'Error interno del servidor',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('configuracion')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({
    summary: 'Obtener configuración para la app Ionic',
    description: 'Datos necesarios para construir la UI de reportes',
  })
  async obtenerConfiguracion() {
    try {
      const [mercados, tiposLocal] = await Promise.all([
        this.prisma.mercado.findMany({
          where: { isActive: true },
          select: {
            id: true,
            nombre_mercado: true,
            direccion: true,
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
            { value: 'LOCAL', label: 'Por Local', icon: 'storefront-outline' },
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
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test de conectividad',
    description: 'Verificar que la API funciona correctamente',
  })
  async testConectividad() {
    return {
      success: true,
      message: 'API de Reportes funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      endpoints_disponibles: [
        'POST /reportes/generar',
        'GET /reportes/configuracion',
        'GET /reportes/test',
        'GET /reportes/demo',
      ],
    };
  }

  @Get('demo')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Demo público de configuración',
    description: 'Endpoint público para probar datos sin autenticación',
  })
  async demoConfiguracion() {
    try {
      const [mercados, tiposLocal, estadisticasBasicas, mercadosLocales] =
        await Promise.all([
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
          this.prisma.factura.aggregate({
            _count: { id: true },
            _sum: { monto: true },
          }),
          this.prisma.mercado.findMany({
            where: { isActive: true },
            include: {
              locales: {
                include: {
                  facturas: {
                    select: { monto: true },
                  },
                },
              },
            },
          }),
        ]);

      // Calcular el total recaudado por cada mercado sumando los montos de todas las facturas de sus locales
      const totalRecaudadoPorMercado = mercadosLocales.map((m) => ({
        mercado_id: m.id,
        nombre_mercado: m.nombre_mercado,
        total_recaudado: m.locales.reduce((sumLocales, local) => {
          return (
            sumLocales +
            local.facturas.reduce((sumFact, f) => sumFact + Number(f.monto), 0)
          );
        }, 0),
      }));

      return {
        success: true,
        demo_data: {
          total_mercados: mercados.length,
          total_facturas: estadisticasBasicas._count.id,
          total_recaudado: Number(estadisticasBasicas._sum?.monto) || 0,
          total_recaudado_por_mercado: totalRecaudadoPorMercado,
          mercados_sample: mercados.slice(0, 3),
          tipos_local_disponibles: tiposLocal
            .map((t) => t.tipo_local)
            .filter(Boolean),
          configuracion_ui: {
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
          },
        },
        timestamp: new Date().toISOString(),
        note: 'Este es un endpoint de demostración público. Para acceso completo use autenticación.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Métodos privados para generar diferentes tipos de reportes
  private async generarReporteFinanciero(whereCondition: any) {
    const [estadisticas, totalesPorEstado, facturasPorMercado] =
      await Promise.all([
        this.prisma.factura.aggregate({
          where: whereCondition,
          _sum: { monto: true },
          _count: { id: true },
          _avg: { monto: true },
        }),
        this.prisma.factura.groupBy({
          by: ['estado'],
          where: whereCondition,
          _sum: { monto: true },
          _count: { id: true },
        }),
        this.obtenerFacturasPorMercado(whereCondition),
      ]);

    return {
      resumen: {
        total_recaudado: Number(estadisticas._sum?.monto) || 0,
        total_facturas: estadisticas._count?.id || 0,
        promedio_factura: Number(estadisticas._avg?.monto) || 0,
      },
      por_estado: totalesPorEstado.reduce((acc, item) => {
        acc[item.estado] = {
          cantidad: item._count?.id || 0,
          monto: Number(item._sum?.monto) || 0,
        };
        return acc;
      }, {}),
      por_mercado: facturasPorMercado,
    };
  }

  private async generarReporteOperacional(whereCondition: any) {
    const [totalFacturas, mercadosActivos, localesActivos] = await Promise.all([
      this.prisma.factura.count({ where: whereCondition }),
      this.contarMercadosActivos(whereCondition),
      this.contarLocalesActivos(whereCondition),
    ]);

    return {
      estadisticas: {
        total_facturas: totalFacturas,
        mercados_activos: mercadosActivos,
        locales_activos: localesActivos,
      },
      rendimiento: await this.obtenerRendimientoBasico(whereCondition),
    };
  }

  private async generarReportePorMercado(whereCondition: any) {
    return {
      mercados: await this.obtenerFacturasPorMercado(whereCondition),
    };
  }

  private async generarReportePorLocal(whereCondition: any) {
    const locales = await this.prisma.local.findMany({
      include: {
        facturas: {
          where: whereCondition,
        },
        mercado: {
          select: { nombre_mercado: true },
        },
      },
    });

    return {
      locales: locales.map((local) => ({
        id: local.id,
        numero_local: local.numero_local,
        nombre_local: local.nombre_local,
        mercado: local.mercado.nombre_mercado,
        total_facturas: local.facturas.length,
        total_recaudado: local.facturas.reduce(
          (sum, f) => sum + Number(f.monto),
          0,
        ),
        facturas_pagadas: local.facturas.filter((f) => f.estado === 'PAGADA')
          .length,
      })),
    };
  }

  // Métodos auxiliares
  private async obtenerFacturasPorMercado(whereCondition: any) {
    const mercados = await this.prisma.mercado.findMany({
      where: { isActive: true },
      include: {
        locales: {
          include: {
            facturas: {
              where: whereCondition,
            },
          },
        },
      },
    });

    return mercados.map((mercado) => {
      const todasFacturas = mercado.locales.flatMap((local) => local.facturas);
      return {
        mercado_id: mercado.id,
        nombre_mercado: mercado.nombre_mercado,
        total_recaudado: todasFacturas.reduce(
          (sum, f) => sum + Number(f.monto),
          0,
        ),
        total_facturas: todasFacturas.length,
        facturas_pagadas: todasFacturas.filter((f) => f.estado === 'PAGADA')
          .length,
        total_locales: mercado.locales.length,
      };
    });
  }

  private async contarMercadosActivos(whereCondition: any) {
    const mercados = await this.prisma.mercado.count({
      where: {
        locales: {
          some: {
            facturas: {
              some: whereCondition,
            },
          },
        },
      },
    });
    return mercados;
  }

  private async contarLocalesActivos(whereCondition: any) {
    const locales = await this.prisma.local.count({
      where: {
        facturas: {
          some: whereCondition,
        },
      },
    });
    return locales;
  }

  private async obtenerRendimientoBasico(whereCondition: any) {
    const facturasHoy = await this.prisma.factura.count({
      where: {
        ...whereCondition,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    return {
      facturas_hoy: facturasHoy,
      eficiencia: facturasHoy > 0 ? 'ALTA' : 'BAJA',
    };
  }
}
