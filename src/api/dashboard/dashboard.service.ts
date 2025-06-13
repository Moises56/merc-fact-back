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
        this.getInvoiceMetrics(),
        this.getEntityMetrics(),
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
          estado: 'PAGADO',
        },
      }),

      // Recaudación anual
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          fecha_pago: {
            gte: startOfYear,
          },
          estado: 'PAGADO',
        },
      }),

      // Total histórico
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: {
          estado: 'PAGADO',
        },
      }),      // Datos para recaudación por local (necesitamos hacer join con local)
      this.prisma.factura.findMany({
        where: {
          estado: 'PAGADO',
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

    // Procesar recaudación por mercado
    const marketRevenueMap = new Map<string, { name: string; total: number }>();
    const localRevenueArray: LocalRevenueDto[] = [];

    // Procesar datos de locales y agregar por mercado
    revenueByLocal.forEach((factura) => {
      if (factura.local) {
        // Recaudación por local
        localRevenueArray.push({
          localId: factura.local.id,
          localName: factura.local.nombre_local || 'Sin nombre',
          total: Number(factura.monto),
        });        // Agregar al mercado
        const marketId = factura.local.mercado.id;
        const marketName = factura.local.mercado.nombre_mercado;
        const currentTotal = marketRevenueMap.get(marketId)?.total || 0;

        marketRevenueMap.set(marketId, {
          name: marketName,
          total: currentTotal + Number(factura.monto),
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

    return {
      monthlyRevenue: Number(monthlyRevenue._sum?.monto) || 0,
      annualRevenue: Number(annualRevenue._sum?.monto) || 0,
      totalRevenue: Number(totalRevenue._sum?.monto) || 0,
      revenueByMarket: revenueByMarketArray,
      revenueByLocal: revenueByLocalSorted,
    };
  }
  private async getInvoiceMetrics(): Promise<InvoiceMetricsDto> {
    const currentDate = new Date();

    const [overdueCount, paidCount, totalCount] = await Promise.all([
      // Facturas vencidas
      this.prisma.factura.count({
        where: {
          fecha_vencimiento: {
            lt: currentDate,
          },
          estado: {
            not: 'PAGADO',
          },
        },
      }),

      // Facturas pagadas
      this.prisma.factura.count({
        where: {
          estado: 'PAGADO',
        },
      }),

      // Total de facturas generadas
      this.prisma.factura.count(),
    ]);

    return {
      overdue: overdueCount,
      paid: paidCount,
      generated: totalCount,
    };
  }

  private async getEntityMetrics(): Promise<EntityMetricsDto> {
    const [totalMarkets, totalLocals, totalUsers] = await Promise.all([
      this.prisma.mercado.count(),
      this.prisma.local.count(),
      this.prisma.user.count(),
    ]);

    return {
      totalMarkets,
      totalLocals,
      totalUsers,
    };
  }
}
