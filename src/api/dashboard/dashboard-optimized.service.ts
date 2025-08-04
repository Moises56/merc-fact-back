import { Injectable, Logger } from '@nestjs/common';
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
export class DashboardOptimizedService {
  private readonly logger = new Logger(DashboardOptimizedService.name);
  
  constructor(private readonly prisma: PrismaService) {}

  async getOptimizedStatistics(): Promise<DashboardStatisticsDto> {
    const startTime = Date.now();
    
    try {
      // Usar una sola consulta SQL optimizada para obtener todas las métricas
      const result = await this.getUnifiedMetrics();
      
      const duration = Date.now() - startTime;
      this.logger.log(`Dashboard statistics generated in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Dashboard statistics failed after ${duration}ms:`, error.message);
      throw error;
    }
  }

  private async getUnifiedMetrics(): Promise<DashboardStatisticsDto> {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Consulta SQL optimizada que obtiene todas las métricas en una sola query
    const metricsQuery = `
      WITH FinancialMetrics AS (
        SELECT 
          SUM(CASE WHEN estado = 'PAGADA' AND fecha_pago >= @startOfMonth THEN monto ELSE 0 END) as monthly_revenue,
          SUM(CASE WHEN estado = 'PAGADA' AND fecha_pago >= @startOfYear THEN monto ELSE 0 END) as annual_revenue,
          SUM(CASE WHEN estado = 'PAGADA' THEN monto ELSE 0 END) as total_revenue,
          SUM(CASE WHEN estado = 'PENDIENTE' THEN monto ELSE 0 END) as pending_amount,
          SUM(CASE WHEN estado = 'VENCIDA' THEN monto ELSE 0 END) as overdue_amount
        FROM facturas
      ),
      InvoiceMetrics AS (
        SELECT 
          COUNT(*) as total_invoices,
          COUNT(CASE WHEN estado = 'PAGADA' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN estado = 'PENDIENTE' THEN 1 END) as pending_invoices,
          COUNT(CASE WHEN estado = 'VENCIDA' THEN 1 END) as overdue_invoices,
          COUNT(CASE WHEN estado = 'ANULADA' THEN 1 END) as cancelled_invoices,
          COUNT(CASE WHEN YEAR(createdAt) = YEAR(GETDATE()) AND MONTH(createdAt) = MONTH(GETDATE()) THEN 1 END) as monthly_invoices
        FROM facturas
      ),
      EntityMetrics AS (
        SELECT 
          (SELECT COUNT(*) FROM mercados WHERE isActive = 1) as active_markets,
          (SELECT COUNT(*) FROM mercados) as total_markets,
          (SELECT COUNT(*) FROM locales WHERE estado_local = 'ACTIVO') as active_locals,
          (SELECT COUNT(*) FROM locales) as total_locals,
          (SELECT COUNT(*) FROM users WHERE isActive = 1) as active_users,
          (SELECT COUNT(*) FROM users) as total_users
      )
      SELECT * FROM FinancialMetrics, InvoiceMetrics, EntityMetrics
    `;

    const [metricsResult] = await this.prisma.$queryRawUnsafe(
      metricsQuery,
      startOfMonth,
      startOfYear
    ) as any[];

    // Consulta separada para revenue por mercado (optimizada)
    const marketRevenueQuery = `
      SELECT 
        m.id as mercado_id,
        m.nombre_mercado,
        ISNULL(SUM(CASE WHEN f.estado = 'PAGADA' THEN f.monto ELSE 0 END), 0) as total_recaudado,
        COUNT(f.id) as total_facturas,
        COUNT(DISTINCT l.id) as total_locales
      FROM mercados m
      LEFT JOIN locales l ON m.id = l.mercadoId
      LEFT JOIN facturas f ON l.id = f.localId
      WHERE m.isActive = 1
      GROUP BY m.id, m.nombre_mercado
      ORDER BY total_recaudado DESC
    `;

    const marketRevenue = await this.prisma.$queryRawUnsafe(marketRevenueQuery) as any[];

    // Consulta para top locales (optimizada)
    const topLocalsQuery = `
      SELECT TOP 10
        l.id as local_id,
        l.nombre_local,
        l.numero_local,
        m.nombre_mercado,
        ISNULL(SUM(CASE WHEN f.estado = 'PAGADA' THEN f.monto ELSE 0 END), 0) as total_recaudado,
        COUNT(f.id) as total_facturas
      FROM locales l
      INNER JOIN mercados m ON l.mercadoId = m.id
      LEFT JOIN facturas f ON l.id = f.localId
      WHERE l.estado_local = 'ACTIVO'
      GROUP BY l.id, l.nombre_local, l.numero_local, m.nombre_mercado
      ORDER BY total_recaudado DESC
    `;

    const topLocals = await this.prisma.$queryRawUnsafe(topLocalsQuery) as any[];

    // Construir respuesta
    const financial: FinancialMetricsDto = {
      monthlyRevenue: Number(metricsResult.monthly_revenue) || 0,
      annualRevenue: Number(metricsResult.annual_revenue) || 0,
      totalRevenue: Number(metricsResult.total_revenue) || 0,
      expectedMonthlyRevenue: 0, // Calcular según lógica de negocio
      expectedAnnualRevenue: 0, // Calcular según lógica de negocio
      revenueByMarket: marketRevenue.map(item => ({
        marketId: item.mercado_id,
        marketName: item.nombre_mercado,
        total: Number(item.total_recaudado),
        monthly: 0, // Requiere consulta adicional
        annual: 0, // Requiere consulta adicional
        totalLocals: Number(item.total_locales),
        paidInvoices: Number(item.total_facturas),
        averageRevenuePerLocal: Number(item.total_locales) > 0 ? Number(item.total_recaudado) / Number(item.total_locales) : 0,
        percentageOfTotalRevenue: 0, // Calcular después
      })) as MarketRevenueDto[],
      revenueByLocal: topLocals.map(item => ({
        localId: item.local_id,
        localName: item.nombre_local || 'Sin nombre',
        total: Number(item.total_recaudado),
      })) as LocalRevenueDto[],
    };

    const invoices: InvoiceMetricsDto = {
      overdue: Number(metricsResult.overdue_invoices) || 0,
      paid: Number(metricsResult.paid_invoices) || 0,
      pending: Number(metricsResult.pending_invoices) || 0,
      cancelled: Number(metricsResult.cancelled_invoices) || 0,
      generated: Number(metricsResult.total_invoices) || 0,
      paymentRate: metricsResult.total_invoices > 0 
        ? Number(((metricsResult.paid_invoices / metricsResult.total_invoices) * 100).toFixed(2))
        : 0,
      overdueRate: metricsResult.total_invoices > 0 
        ? Number(((metricsResult.overdue_invoices / metricsResult.total_invoices) * 100).toFixed(2))
        : 0,
      collectionEfficiency: metricsResult.total_invoices > 0 
        ? Number(((metricsResult.paid_invoices / metricsResult.total_invoices) * 100).toFixed(2))
        : 0,
      pendingAmount: Number(metricsResult.pending_amount) || 0,
      overdueAmount: Number(metricsResult.overdue_amount) || 0,
    };

    const entities: EntityMetricsDto = {
      totalMarkets: Number(metricsResult.total_markets) || 0,
      totalLocals: Number(metricsResult.total_locals) || 0,
      totalUsers: Number(metricsResult.total_users) || 0,
      activeMarkets: Number(metricsResult.active_markets) || 0,
      activeLocals: Number(metricsResult.active_locals) || 0,
      activeUsers: Number(metricsResult.active_users) || 0,
      occupancyRate: Number(metricsResult.total_locals) > 0 
        ? Number(((metricsResult.active_locals / metricsResult.total_locals) * 100).toFixed(2))
        : 0,
      averageLocalsPerMarket: Number(metricsResult.total_markets) > 0 
        ? Number((metricsResult.total_locals / metricsResult.total_markets).toFixed(2))
        : 0,
      localsWithPaymentsThisMonth: 0, // Requiere consulta adicional
    };

    return {
      financial,
      invoices,
      entities,
    };
  }

  // Método para obtener métricas específicas con cache
  async getFinancialMetricsOnly(): Promise<FinancialMetricsDto> {
    const query = `
      SELECT 
        SUM(CASE WHEN estado = 'PAGADA' AND fecha_pago >= DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0) THEN monto ELSE 0 END) as monthly_revenue,
        SUM(CASE WHEN estado = 'PAGADA' AND fecha_pago >= DATEADD(year, DATEDIFF(year, 0, GETDATE()), 0) THEN monto ELSE 0 END) as annual_revenue,
        SUM(CASE WHEN estado = 'PAGADA' THEN monto ELSE 0 END) as total_revenue,
        SUM(CASE WHEN estado = 'PENDIENTE' THEN monto ELSE 0 END) as pending_amount,
        SUM(CASE WHEN estado = 'VENCIDA' THEN monto ELSE 0 END) as overdue_amount
      FROM facturas
    `;

    const [result] = await this.prisma.$queryRawUnsafe(query) as any[];

    return {
      monthlyRevenue: Number(result.monthly_revenue) || 0,
      annualRevenue: Number(result.annual_revenue) || 0,
      totalRevenue: Number(result.total_revenue) || 0,
      expectedMonthlyRevenue: 0,
      expectedAnnualRevenue: 0,
      revenueByMarket: [],
      revenueByLocal: [],
    };
  }

  // Método para obtener solo conteos rápidos
  async getQuickCounts() {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM facturas WHERE estado = 'PAGADA') as paid_invoices,
        (SELECT COUNT(*) FROM facturas WHERE estado = 'PENDIENTE') as pending_invoices,
        (SELECT COUNT(*) FROM facturas WHERE estado = 'VENCIDA') as overdue_invoices,
        (SELECT COUNT(*) FROM mercados WHERE isActive = 1) as active_markets,
        (SELECT COUNT(*) FROM locales WHERE estado_local = 'ACTIVO') as active_locals,
        (SELECT COUNT(*) FROM users WHERE isActive = 1) as active_users
    `;

    const [result] = await this.prisma.$queryRawUnsafe(query) as any[];

    return {
      paid_invoices: Number(result.paid_invoices) || 0,
      pending_invoices: Number(result.pending_invoices) || 0,
      overdue_invoices: Number(result.overdue_invoices) || 0,
      active_markets: Number(result.active_markets) || 0,
      active_locals: Number(result.active_locals) || 0,
      active_users: Number(result.active_users) || 0,
    };
  }
}