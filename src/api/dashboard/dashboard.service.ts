import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  DashboardStatisticsDto,
  FinancialMetricsDto,
  InvoiceMetricsDto,
  EntityMetricsDto,
  MarketRevenueDto,
  LocalRevenueDto,
} from './dto/dashboard-statistics.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(): Promise<DashboardStatisticsDto> {
    try {
      // Ejecutar todas las consultas en paralelo para mejor performance
      const [
        financialMetrics,
        invoiceMetrics,
        entityMetrics,
      ] = await Promise.all([
        this.getFinancialMetrics(),
        this.getEnhancedInvoiceMetrics(),
        this.getEnhancedEntityMetrics(),
      ]);

      return {
        financial: financialMetrics,
        invoices: invoiceMetrics,
        entities: entityMetrics,
      };
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      throw error;
    }
  }
  private async getFinancialMetrics(): Promise<FinancialMetricsDto> {
    const currentDate = new Date();
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Consultas paralelas para métricas financieras
    const [
      monthlyRevenue,
      annualRevenue,
      totalRevenue,
      revenueByLocal,
    ] = await Promise.all([
      // Recaudación mensual
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          fecha_pago: {
            gte: startOfMonth,
          },
          estado: 'PAGADA',
        },
      }),

      // Recaudación anual
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          fecha_pago: {
            gte: startOfYear,
          },
          estado: 'PAGADA',
        },
      }),

      // Total histórico
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          estado: 'PAGADA',
        },
      }),      // Datos para recaudación por local (necesitamos hacer join con local)
      this.prisma.factura.findMany({
        where: {
          estado: 'PAGADA',
        },
        include: {
          local: {
            include: {
              mercado: true,
            },
          },
        },
      }),
    ]);

    // Procesar recaudación por mercado con más detalles
    const marketRevenueMap = new Map<
      string,
      {
        name: string;
        total: number;
        monthly: number;
        annual: number;
        totalLocals: number;
        paidInvoices: number;
      }
    >();
    const localRevenueArray: LocalRevenueDto[] = [];

    // Procesar datos de locales y agregar por mercado
    revenueByLocal.forEach((factura) => {
      if (factura.local) {
        // Recaudación por local
        localRevenueArray.push({
          localId: factura.local.id,
          localName: factura.local.nombre_local || 'Sin nombre',
          total: Number(factura.monto),
        });

        // Agregar al mercado con más detalles
        const marketId = factura.local.mercado.id;
        const marketName = factura.local.mercado.nombre_mercado;
        const current = marketRevenueMap.get(marketId) || {
          name: marketName,
          total: 0,
          monthly: 0,
          annual: 0,
          totalLocals: 0,
          paidInvoices: 0,
        };

        // Verificar si es del mes/año actual
        const facturaDate = factura.fecha_pago || factura.createdAt;
        const isCurrentMonth = facturaDate >= startOfMonth;
        const isCurrentYear = facturaDate >= startOfYear;

        marketRevenueMap.set(marketId, {
          name: marketName,
          total: current.total + Number(factura.monto),
          monthly: current.monthly + (isCurrentMonth ? Number(factura.monto) : 0),
          annual: current.annual + (isCurrentYear ? Number(factura.monto) : 0),
          totalLocals: current.totalLocals,
          paidInvoices: current.paidInvoices + 1,
        });
      }
    });

    // Obtener el conteo de locales por mercado
    const localesByMarket = await this.prisma.local.groupBy({
      by: ['mercadoId'],
      _count: { id: true },
    });

    // Agregar el conteo de locales a cada mercado
    localesByMarket.forEach((group) => {
      const current = marketRevenueMap.get(group.mercadoId);
      if (current) {
        marketRevenueMap.set(group.mercadoId, {
          ...current,
          totalLocals: group._count.id,
        });
      }
    });

    // Convertir Map a Array y ordenar por total
    const revenueByMarketArray: MarketRevenueDto[] = Array.from(
      marketRevenueMap.entries(),
    )
      .map(([marketId, data]) => ({
        marketId,
        marketName: data.name,
        total: data.total,
        monthly: data.monthly,
        annual: data.annual,
        totalLocals: data.totalLocals,
        paidInvoices: data.paidInvoices,
        averageRevenuePerLocal: data.totalLocals > 0 
          ? Math.round((data.total / data.totalLocals) * 100) / 100 
          : 0,
        percentageOfTotalRevenue: Number(totalRevenue._sum?.monto) > 0 
          ? Math.round((data.total / Number(totalRevenue._sum?.monto)) * 100 * 100) / 100
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Agregar recaudación por local ordenada
    const revenueByLocalSorted = localRevenueArray
      .reduce((acc, current) => {
        const existing = acc.find((item) => item.localId === current.localId);
        if (existing) {
          existing.total += current.total;
        } else {
          acc.push(current);
        }
        return acc;
      }, [] as LocalRevenueDto[])
      .sort((a, b) => b.total - a.total);

    // Calcular totales esperados de recaudación
    const [expectedMonthlyRevenue, expectedAnnualRevenue] = await Promise.all([
      // Total esperado mensual: suma de todos los locales activos
      this.prisma.local.aggregate({
        _sum: { monto_mensual: true },
        where: {
          estado_local: 'ACTIVO',
        },
      }),
      // Total esperado anual: suma mensual * 12
      this.prisma.local.aggregate({
        _sum: { monto_mensual: true },
        where: {
          estado_local: 'ACTIVO',
        },
      }),
    ]);

    const expectedMonthly = Number(expectedMonthlyRevenue._sum?.monto_mensual) || 0;
    const expectedAnnual = expectedMonthly * 12;

    return {
      monthlyRevenue: Number(monthlyRevenue._sum?.monto) || 0,
      annualRevenue: Number(annualRevenue._sum?.monto) || 0,
      totalRevenue: Number(totalRevenue._sum?.monto) || 0,
      expectedMonthlyRevenue: expectedMonthly,
      expectedAnnualRevenue: expectedAnnual,
      revenueByMarket: revenueByMarketArray,
      revenueByLocal: revenueByLocalSorted,
    };
  }


  private async getEnhancedInvoiceMetrics(): Promise<InvoiceMetricsDto> {
    const currentDate = new Date();

    const [
      overdueCount,
      paidCount,
      pendingCount,
      cancelledCount,
      totalCount,
      pendingAmount,
      overdueAmount,
    ] = await Promise.all([
      // Facturas vencidas
      this.prisma.factura.count({
        where: {
          fecha_vencimiento: {
            lt: currentDate,
          },
          estado: {
            not: 'PAGADA',
          },
        },
      }),

      // Facturas pagadas
      this.prisma.factura.count({
        where: {
          estado: 'PAGADA',
        },
      }),

      // Facturas pendientes
      this.prisma.factura.count({
        where: {
          estado: 'PENDIENTE',
        },
      }),

      // Facturas anuladas
      this.prisma.factura.count({
        where: {
          estado: 'ANULADA',
        },
      }),

      // Total de facturas generadas
      this.prisma.factura.count(),

      // Monto total pendiente
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          estado: 'PENDIENTE',
        },
      }),

      // Monto total vencido
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          fecha_vencimiento: {
            lt: currentDate,
          },
          estado: {
            not: 'PAGADA',
          },
        },
      }),
    ]);

    // Calcular métricas adicionales
    const paymentRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    const overdueRate = totalCount > 0 ? (overdueCount / totalCount) * 100 : 0;
    const collectionEfficiency = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return {
      overdue: overdueCount,
      paid: paidCount,
      pending: pendingCount,
      cancelled: cancelledCount,
      generated: totalCount,
      paymentRate: Math.round(paymentRate * 100) / 100,
      overdueRate: Math.round(overdueRate * 100) / 100,
      collectionEfficiency: Math.round(collectionEfficiency * 100) / 100,
      pendingAmount: Number(pendingAmount._sum?.monto) || 0,
      overdueAmount: Number(overdueAmount._sum?.monto) || 0,
    };
  }



  private async getEnhancedEntityMetrics(): Promise<EntityMetricsDto> {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const [
      totalMarkets,
      activeMarkets,
      totalLocals,
      activeLocals,
      totalUsers,
      activeUsers,
      localsWithPaymentsThisMonth,
    ] = await Promise.all([
      this.prisma.mercado.count(),
      this.prisma.mercado.count({
        where: { isActive: true },
      }),
      this.prisma.local.count(),
      this.prisma.local.count({
        where: { estado_local: 'ACTIVO' },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { isActive: true },
      }),
      // Locales que han tenido pagos este mes
      this.prisma.local.count({
        where: {
          facturas: {
            some: {
              estado: 'PAGADA',
              fecha_pago: {
                gte: startOfMonth,
              },
            },
          },
        },
      }),
    ]);

    // Calcular métricas derivadas
    const occupancyRate = totalLocals > 0 ? (activeLocals / totalLocals) * 100 : 0;
    const averageLocalsPerMarket = totalMarkets > 0 ? totalLocals / totalMarkets : 0;

    return {
      totalMarkets,
      activeMarkets,
      totalLocals,
      activeLocals,
      totalUsers,
      activeUsers,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      averageLocalsPerMarket: Math.round(averageLocalsPerMarket * 100) / 100,
      localsWithPaymentsThisMonth,
    };
  }
}
