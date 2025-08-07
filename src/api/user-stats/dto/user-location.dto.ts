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
