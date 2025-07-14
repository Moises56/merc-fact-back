import { ApiProperty } from '@nestjs/swagger';

// DTOs existentes expandidos
export class MarketRevenueDto {
  @ApiProperty({ description: 'ID del mercado' })
  marketId: string;

  @ApiProperty({ description: 'Nombre del mercado' })
  marketName: string;

  @ApiProperty({ description: 'Total recaudado' })
  total: number;

  @ApiProperty({ description: 'Recaudación mensual' })
  monthly: number;

  @ApiProperty({ description: 'Recaudación anual' })
  annual: number;

  @ApiProperty({ description: 'Número de locales en el mercado' })
  totalLocals: number;

  @ApiProperty({ description: 'Número de facturas pagadas' })
  paidInvoices: number;

  @ApiProperty({ description: 'Promedio de recaudación por local' })
  averageRevenuePerLocal: number;

  @ApiProperty({ description: 'Porcentaje del total de recaudación' })
  percentageOfTotalRevenue: number;
}

export class LocalRevenueDto {
  @ApiProperty({ description: 'ID del local' })
  localId: string;

  @ApiProperty({ description: 'Nombre del local' })
  localName: string;

  @ApiProperty({ description: 'Número del local' })
  localNumber: string;

  @ApiProperty({ description: 'Total recaudado' })
  total: number;

  @ApiProperty({ description: 'Número de facturas pagadas' })
  paidInvoices: number;

  @ApiProperty({ description: 'Promedio por factura' })
  averagePerInvoice: number;

  @ApiProperty({ description: 'Mercado al que pertenece' })
  marketName: string;
}

export class FinancialMetricsDto {
  @ApiProperty({ description: 'Recaudación del mes actual' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Recaudación del año actual' })
  annualRevenue: number;

  @ApiProperty({ description: 'Total recaudado histórico' })
  totalRevenue: number;

  @ApiProperty({
    description: 'Recaudación promedio por mes (últimos 12 meses)',
  })
  averageMonthlyRevenue: number;

  @ApiProperty({ description: 'Crecimiento mensual (porcentaje)' })
  monthlyGrowthPercentage: number;

  @ApiProperty({ description: 'Recaudación esperada mensual total' })
  expectedMonthlyRevenue: number;

  @ApiProperty({ description: 'Porcentaje de cumplimiento de expectativas' })
  expectedVsActualPercentage: number;

  @ApiProperty({
    description: 'Recaudación por mercado',
    type: [MarketRevenueDto],
  })
  revenueByMarket: MarketRevenueDto[];

  @ApiProperty({
    description: 'Top 10 locales por recaudación',
    type: [LocalRevenueDto],
  })
  topRevenueLocals: LocalRevenueDto[];
}

export class InvoiceMetricsDto {
  @ApiProperty({ description: 'Facturas vencidas' })
  overdue: number;

  @ApiProperty({ description: 'Facturas pagadas' })
  paid: number;

  @ApiProperty({ description: 'Facturas pendientes' })
  pending: number;

  @ApiProperty({ description: 'Facturas anuladas' })
  cancelled: number;

  @ApiProperty({ description: 'Total de facturas generadas' })
  generated: number;

  @ApiProperty({ description: 'Porcentaje de pago' })
  paymentRate: number;

  @ApiProperty({ description: 'Porcentaje de morosidad' })
  overdueRate: number;

  @ApiProperty({ description: 'Eficiencia de cobranza (pagadas/generadas)' })
  collectionEfficiency: number;

  @ApiProperty({ description: 'Monto total pendiente de pago' })
  pendingAmount: number;

  @ApiProperty({ description: 'Monto total vencido' })
  overdueAmount: number;
}

export class EntityMetricsDto {
  @ApiProperty({ description: 'Total de mercados' })
  totalMarkets: number;

  @ApiProperty({ description: 'Total de locales' })
  totalLocals: number;

  @ApiProperty({ description: 'Total de usuarios' })
  totalUsers: number;

  @ApiProperty({ description: 'Mercados activos' })
  activeMarkets: number;

  @ApiProperty({ description: 'Locales activos' })
  activeLocals: number;

  @ApiProperty({ description: 'Usuarios activos' })
  activeUsers: number;

  @ApiProperty({ description: 'Tasa de ocupación de locales (%)' })
  occupancyRate: number;

  @ApiProperty({ description: 'Promedio de locales por mercado' })
  averageLocalsPerMarket: number;

  @ApiProperty({ description: 'Locales con facturas pagadas este mes' })
  localsWithPaymentsThisMonth: number;
}

export class PerformanceMetricsDto {
  @ApiProperty({ description: 'Mercado con mayor recaudación' })
  topMarket: {
    name: string;
    revenue: number;
  };

  @ApiProperty({ description: 'Local con mayor recaudación' })
  topLocal: {
    name: string;
    number: string;
    revenue: number;
    marketName: string;
  };

  @ApiProperty({ description: 'Día del mes con más pagos' })
  peakPaymentDay: number;

  @ApiProperty({ description: 'Promedio de días para pago' })
  averageDaysToPayment: number;
}

export class DashboardStatisticsDto {
  @ApiProperty({
    description: 'Métricas financieras',
    type: FinancialMetricsDto,
  })
  financial: FinancialMetricsDto;

  @ApiProperty({
    description: 'Métricas de facturación',
    type: InvoiceMetricsDto,
  })
  invoices: InvoiceMetricsDto;

  @ApiProperty({
    description: 'Métricas de entidades',
    type: EntityMetricsDto,
  })
  entities: EntityMetricsDto;

  @ApiProperty({
    description: 'Métricas de rendimiento',
    type: PerformanceMetricsDto,
  })
  performance: PerformanceMetricsDto;

  @ApiProperty({ description: 'Última actualización de datos' })
  lastUpdated: string;

  @ApiProperty({ description: 'Tiempo de generación del reporte (ms)' })
  generationTime: number;
}
