import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

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
}
