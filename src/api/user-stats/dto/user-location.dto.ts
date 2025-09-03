import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ConsultaType, ConsultaSubtype } from './consulta-log.dto';

// DTO para estadísticas de consultas por tipo
export class ConsultationStatsDto {
  @ApiProperty({
    description: 'Número de consultas ICS normales (sin amnistía)',
    example: 25,
  })
  icsNormal: number;

  @ApiProperty({
    description: 'Número de consultas ICS con amnistía',
    example: 8,
  })
  icsAmnistia: number;

  @ApiProperty({
    description: 'Número de consultas EC normales (sin amnistía)',
    example: 15,
  })
  ecNormal: number;

  @ApiProperty({
    description: 'Número de consultas EC con amnistía',
    example: 5,
  })
  ecAmnistia: number;

  @ApiProperty({
    description: 'Total de consultas exitosas',
    example: 45,
  })
  totalExitosas: number;

  @ApiProperty({
    description: 'Total de consultas con error',
    example: 8,
  })
  totalErrores: number;

  @ApiProperty({
    description: 'Total de consultas realizadas',
    example: 53,
  })
  totalConsultas: number;

  @ApiProperty({
    description: 'Duración promedio de consultas en milisegundos',
    example: 1250,
    required: false,
  })
  promedioDuracionMs?: number;

  @ApiProperty({
    description: 'Total acumulado de resultados encontrados',
    example: 125000.50,
    required: false,
  })
  totalAcumulado?: number;
}

// DTO para historial detallado de consultas por tipo
export class TypeConsultaHistoryDto {
  @ApiProperty({
    enum: ConsultaType,
    description: 'Tipo de consulta (EC o ICS)',
    example: 'EC'
  })
  type: ConsultaType;

  @ApiProperty({
    enum: ConsultaSubtype,
    description: 'Método de consulta (normal o amnistia)',
    example: 'normal'
  })
  method: ConsultaSubtype;

  @ApiProperty({
    description: 'Clave de consulta (claveCatastral o dni)',
    example: '12345678901234567890'
  })
  key: string;

  @ApiProperty({
    description: 'Total consultado formateado como moneda',
    example: 'L.1,250.75'
  })
  total: string;

  @ApiProperty({
    description: 'Fecha de la consulta',
    example: '2024-01-15T10:30:00Z'
  })
  consultedAt: Date;
}

export class AssignUserLocationDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Nombre de la ubicación' })
  @IsString()
  locationName: string;

  @ApiProperty({ description: 'Código de la ubicación', required: false })
  @IsOptional()
  @IsString()
  locationCode?: string;

  @ApiProperty({ description: 'Descripción de la ubicación', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UserLocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  locationName: string;

  @ApiProperty({ required: false })
  locationCode?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  assignedAt: Date;

  @ApiProperty({ required: false })
  assignedBy?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserLocationHistoryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  locationName: string;

  @ApiProperty({ required: false })
  locationCode?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  assignedAt: Date;

  @ApiProperty({ required: false })
  assignedBy?: string;

  @ApiProperty({ required: false })
  assignedByUsername?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({
    required: false,
    description: 'Duración en días que estuvo asignada esta ubicación',
  })
  durationDays?: number;

  @ApiProperty({
    required: false,
    description: 'Fecha cuando se desactivó esta ubicación',
  })
  deactivatedAt?: Date;

  @ApiProperty({ 
    description: 'Estadísticas de consultas realizadas en esta ubicación específica',
    type: ConsultationStatsDto,
    required: false 
  })
  consultationStats?: ConsultationStatsDto;

  @ApiProperty({
    description: 'Historial detallado de consultas por tipo',
    type: [TypeConsultaHistoryDto],
    required: false
  })
  typeConsultaHistory?: TypeConsultaHistoryDto[];
}

export class UserLocationHistoryResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiProperty({ required: false })
  currentLocation?: UserLocationHistoryItemDto;

  @ApiProperty({ type: [UserLocationHistoryItemDto] })
  locationHistory: UserLocationHistoryItemDto[];

  @ApiProperty()
  totalLocations: number;

  @ApiProperty({ required: false })
  firstAssignedAt?: Date;

  @ApiProperty({ required: false })
  lastAssignedAt?: Date;

  @ApiProperty({ 
    description: 'Estadísticas de consultas realizadas por el usuario',
    type: ConsultationStatsDto,
    required: false 
  })
  consultationStats?: ConsultationStatsDto;
}

export class GetUserLocationHistoryDto {
  @ApiProperty({ description: 'ID del usuario', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Incluir solo ubicaciones activas',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean;

  @ApiProperty({
    description: 'Ordenar por fecha de asignación',
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Límite de resultados',
    required: false,
    default: 50,
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Página para paginación',
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Incluir estadísticas de consultas',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeConsultationStats?: boolean;

  @ApiProperty({
    description: 'Fecha de inicio para filtrar estadísticas de consultas (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  statsDateFrom?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar estadísticas de consultas (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  statsDateTo?: string;
}
