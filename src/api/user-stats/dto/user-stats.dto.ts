import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum StatsTimeRange {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  CUSTOM = 'custom',
}

export class GetUserStatsDto {
  @ApiProperty({ description: 'ID del usuario', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Ubicación del usuario', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    enum: StatsTimeRange,
    required: false,
    default: StatsTimeRange.MONTH,
  })
  @IsOptional()
  @IsEnum(StatsTimeRange)
  timeRange?: StatsTimeRange;

  @ApiProperty({ description: 'Fecha de inicio (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // Nuevos filtros para logs
  @ApiProperty({ description: 'Tipo de consulta (EC o ICS)', required: false })
  @IsOptional()
  @IsString()
  consultaType?: string;

  @ApiProperty({
    description: 'Subtipo de consulta (amnistia o normal)',
    required: false,
  })
  @IsOptional()
  @IsString()
  consultaSubtype?: string;

  @ApiProperty({ description: 'Nombre de usuario', required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    description: 'Ubicación del usuario (Mall Premier, etc)',
    required: false,
  })
  @IsOptional()
  @IsString()
  userLocation?: string;

  @ApiProperty({
    description: 'Resultado de la consulta (SUCCESS, ERROR, NOT_FOUND)',
    required: false,
  })
  @IsOptional()
  @IsString()
  resultado?: string;

  @ApiProperty({
    description: 'Parámetros de búsqueda (claveCatastral o dni)',
    required: false,
  })
  @IsOptional()
  @IsString()
  parametros?: string;
}

export class UserStatsResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  userLocation?: string;

  @ApiProperty()
  totalConsultas: number;

  @ApiProperty()
  consultasEC: number;

  @ApiProperty()
  consultasICS: number;

  @ApiProperty()
  consultasExitosas: number;

  @ApiProperty()
  consultasConError: number;

  @ApiProperty()
  consultasNoEncontradas: number;

  @ApiProperty()
  promedioTiempoRespuesta: number; // En milisegundos

  @ApiProperty()
  totalRecaudadoConsultado: number;

  @ApiProperty()
  ultimaConsulta?: Date;

  @ApiProperty()
  periodoConsultado: string;
}

export class LocationStatsResponseDto {
  @ApiProperty()
  location: string;

  @ApiProperty()
  totalUsuarios: number;

  @ApiProperty()
  totalConsultas: number;

  @ApiProperty()
  consultasEC: number;

  @ApiProperty()
  consultasICS: number;

  @ApiProperty()
  promedioConsultasPorUsuario: number;

  @ApiProperty({ type: [UserStatsResponseDto] })
  usuariosStats: UserStatsResponseDto[];
}

export class GeneralStatsResponseDto {
  @ApiProperty()
  totalUsuarios: number;

  @ApiProperty()
  usuariosActivos: number; // Usuarios que han hecho consultas en el período

  @ApiProperty()
  totalConsultas: number;

  @ApiProperty()
  consultasPorTipo: {
    EC: number;
    ICS: number;
  };

  @ApiProperty()
  consultasPorResultado: {
    SUCCESS: number;
    ERROR: number;
    NOT_FOUND: number;
  };

  @ApiProperty({ type: [LocationStatsResponseDto] })
  estatsPorUbicacion: LocationStatsResponseDto[];

  @ApiProperty({ type: [UserStatsResponseDto] })
  topUsuarios: UserStatsResponseDto[]; // Top 10 usuarios más activos
}

// DTOs para el endpoint match
export class GetMatchDto {
  @ApiProperty({ description: 'Fecha de inicio para filtrar pagos (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'Fecha de fin para filtrar pagos (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Año específico para filtrar pagos', required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ 
    description: 'Tipo de consulta para filtrar (EC o ICS)', 
    required: false,
    enum: ['EC', 'ICS']
  })
  @IsOptional()
  @IsString()
  consultaType?: string;

  @ApiProperty({ 
    description: 'Fecha de inicio para filtrar consultas (YYYY-MM-DD). Por defecto desde 19 agosto 2025', 
    required: false 
  })
  @IsOptional()
  @IsDateString()
  consultaStartDate?: string;

  @ApiProperty({ 
    description: 'Fecha de fin para filtrar consultas (YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsDateString()
  consultaEndDate?: string;
}

export class ConsultaLogMatchDto {
  @ApiProperty({ description: 'Parámetros de la consulta (clave catastral o DNI)' })
  parametros: string;

  @ApiProperty({ description: 'Fecha de creación de la consulta' })
  createdAt: Date;

  @ApiProperty({ description: 'Total encontrado en la consulta', required: false })
  totalEncontrado?: number;
}

export class RecaudoMatchDto {
  @ApiProperty({ description: 'Artículo (clave catastral)' })
  ARTICULO: string;

  @ApiProperty({ description: 'Identidad del contribuyente' })
  IDENTIDAD: string;

  @ApiProperty({ description: 'Fecha de pago' })
  FECHA_PAGO: Date;

  @ApiProperty({ description: 'Total pagado' })
  TOTAL_PAGADO: number;

  @ApiProperty({ description: 'Año de pago' })
  ANIO_PAGADO: number;
}

export class MatchResultDto {
  @ApiProperty({ description: 'Parámetro que hizo match' })
  parametro: string;

  @ApiProperty({ description: 'Datos de la consulta en nuestro sistema', type: ConsultaLogMatchDto })
  consultaLog: ConsultaLogMatchDto;

  @ApiProperty({ description: 'Datos del pago en RECAUDO', type: RecaudoMatchDto })
  recaudoData: RecaudoMatchDto;

  @ApiProperty({ description: 'Tipo de pago: pago_mediante_app (pago después de consulta) o pago_previo_consulta (pago antes de consulta)' })
  tipoPago: 'pago_mediante_app' | 'pago_previo_consulta';

  @ApiProperty({ description: 'Indica si el pago fue realizado mediante la aplicación (después de la consulta)' })
  esPagoMedianteApp: boolean;
}

export class MatchResponseDto {
  @ApiProperty({ description: 'Total de consultas SUCCESS analizadas' })
  totalConsultasAnalizadas: number;

  @ApiProperty({ description: 'Total de matches encontrados' })
  totalMatches: number;

  @ApiProperty({ description: 'Total de pagos mediante la aplicación (después de consulta)' })
  totalPagosMedianteApp: number;

  @ApiProperty({ description: 'Total de pagos previos a la consulta' })
  totalPagosPrevios: number;

  @ApiProperty({ description: 'Suma total de totalEncontrado de las consultas' })
  sumaTotalEncontrado: number;

  @ApiProperty({ description: 'Suma total de pagos en RECAUDO' })
  sumaTotalPagado: number;

  @ApiProperty({ description: 'Suma total de pagos mediante la aplicación' })
  sumaTotalPagadoMedianteApp: number;

  @ApiProperty({ description: 'Suma total de pagos previos a consultas' })
  sumaTotalPagosPrevios: number;

  @ApiProperty({ description: 'Período consultado' })
  periodoConsultado: string;

  @ApiProperty({ description: 'Lista de matches encontrados', type: [MatchResultDto] })
  matches: MatchResultDto[];
}
