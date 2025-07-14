import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ description: 'Número de locales' })
  totalLocals: number;

  @ApiProperty({ description: 'Facturas pagadas' })
  paidInvoices: number;

  @ApiProperty({ description: 'Promedio por local' })
  averageRevenuePerLocal: number;

  @ApiProperty({ description: 'Porcentaje del total' })
  percentageOfTotalRevenue: number;
}

export class LocalRevenueDto {
  @ApiProperty({ description: 'ID del local' })
  localId: string;

  @ApiProperty({ description: 'Nombre del local' })
  localName: string;

  @ApiProperty({ description: 'Total recaudado' })
  total: number;
}

export class FinancialMetricsDto {
  @ApiProperty({ description: 'Recaudación del mes actual' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Recaudación del año actual' })
  annualRevenue: number;

  @ApiProperty({ description: 'Total recaudado histórico' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total esperado a recaudar mensualmente' })
  expectedMonthlyRevenue: number;

  @ApiProperty({ description: 'Total esperado a recaudar anualmente' })
  expectedAnnualRevenue: number;

  @ApiProperty({ 
    description: 'Recaudación por mercado', 
    type: [MarketRevenueDto] 
  })
  revenueByMarket: MarketRevenueDto[];

  @ApiProperty({ 
    description: 'Recaudación por local', 
    type: [LocalRevenueDto] 
  })
  revenueByLocal: LocalRevenueDto[];
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

  @ApiProperty({ description: 'Eficiencia de cobranza' })
  collectionEfficiency: number;

  @ApiProperty({ description: 'Monto total pendiente' })
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

  @ApiProperty({ description: 'Tasa de ocupación (%)' })
  occupancyRate: number;

  @ApiProperty({ description: 'Promedio locales por mercado' })
  averageLocalsPerMarket: number;

  @ApiProperty({ description: 'Locales con pagos este mes' })
  localsWithPaymentsThisMonth: number;
}

export class DashboardStatisticsDto {
  @ApiProperty({ description: 'Métricas financieras' })
  financial: FinancialMetricsDto;

  @ApiProperty({ description: 'Métricas de facturación' })
  invoices: InvoiceMetricsDto;

  @ApiProperty({ description: 'Métricas de entidades' })
  entities: EntityMetricsDto;
}
