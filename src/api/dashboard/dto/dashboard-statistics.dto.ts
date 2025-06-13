import { ApiProperty } from '@nestjs/swagger';

export class MarketRevenueDto {
  @ApiProperty({ description: 'ID del mercado' })
  marketId: string;

  @ApiProperty({ description: 'Nombre del mercado' })
  marketName: string;

  @ApiProperty({ description: 'Total recaudado' })
  total: number;
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

  @ApiProperty({ description: 'Total de facturas generadas' })
  generated: number;
}

export class EntityMetricsDto {
  @ApiProperty({ description: 'Total de mercados' })
  totalMarkets: number;

  @ApiProperty({ description: 'Total de locales' })
  totalLocals: number;

  @ApiProperty({ description: 'Total de usuarios' })
  totalUsers: number;
}

export class DashboardStatisticsDto {
  @ApiProperty({ description: 'Métricas financieras' })
  financial: FinancialMetricsDto;

  @ApiProperty({ description: 'Métricas de facturación' })
  invoices: InvoiceMetricsDto;

  @ApiProperty({ description: 'Métricas de entidades' })
  entities: EntityMetricsDto;
}
