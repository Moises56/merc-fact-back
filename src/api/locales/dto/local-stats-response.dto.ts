import { ApiProperty } from '@nestjs/swagger';

export class LocalStatsFacturasDto {
  @ApiProperty({ description: 'Total de facturas del local' })
  total_facturas: number;

  @ApiProperty({ description: 'Facturas pendientes' })
  facturas_pendientes: number;

  @ApiProperty({ description: 'Facturas pagadas' })
  facturas_pagadas: number;

  @ApiProperty({ description: 'Facturas vencidas' })
  facturas_vencidas: number;

  @ApiProperty({ description: 'Facturas anuladas' })
  facturas_anuladas: number;
}

export class LocalStatsFinancierasDto {
  @ApiProperty({ description: 'Total recaudado (facturas pagadas)' })
  total_recaudado: number;

  @ApiProperty({ description: 'Monto total de todas las facturas' })
  monto_total_facturas: number;

  @ApiProperty({ description: 'Monto pendiente de cobro' })
  monto_pendiente: number;

  @ApiProperty({ description: 'Recaudo esperado mensual' })
  recaudo_esperado_mensual: number;

  @ApiProperty({ description: 'Recaudo esperado anual' })
  recaudo_esperado_anual: number;

  @ApiProperty({ description: 'Porcentaje de recaudación' })
  porcentaje_recaudacion: number;
}

export class LocalStatsMercadoDto {
  @ApiProperty({ description: 'ID del mercado' })
  id: string;

  @ApiProperty({ description: 'Nombre del mercado' })
  nombre: string;
}

export class LocalStatsResponseDto {
  @ApiProperty({ description: 'ID del local' })
  local_id: string;

  @ApiProperty({ description: 'Nombre del local' })
  local_nombre: string;

  @ApiProperty({ description: 'Número del local' })
  local_numero: string;

  @ApiProperty({ description: 'Estado del local' })
  local_estado: string;

  @ApiProperty({
    description: 'Información del mercado',
    type: LocalStatsMercadoDto,
  })
  mercado: LocalStatsMercadoDto;

  @ApiProperty({
    description: 'Estadísticas de facturas',
    type: LocalStatsFacturasDto,
  })
  estadisticas_facturas: LocalStatsFacturasDto;

  @ApiProperty({
    description: 'Estadísticas financieras',
    type: LocalStatsFinancierasDto,
  })
  estadisticas_financieras: LocalStatsFinancierasDto;
}
