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
