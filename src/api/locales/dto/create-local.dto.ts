import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoLocal, EstadoLocal } from '../../../common/enums';
import { Transform } from 'class-transformer';

export class CreateLocaleDto {
  @ApiPropertyOptional({
    description: 'Nombre del local comercial',
    example: 'Carnicería La Esperanza',
  })
  @IsString()
  @IsOptional()
  nombre_local?: string;

  @ApiPropertyOptional({
    description: 'Número del local',
    example: 'A-001',
  })
  @IsString()
  @IsOptional()
  numero_local?: string;

  @ApiPropertyOptional({
    description: 'Permiso de operación',
    example: 'PO-2024-001',
  })
  @IsString()
  @IsOptional()
  permiso_operacion?: string;

  @ApiPropertyOptional({
    description: 'Tipo de local comercial',
    enum: TipoLocal,
    example: TipoLocal.COMIDA,
  })
  @IsEnum(TipoLocal, { message: 'Tipo de local debe ser válido' })
  @IsOptional()
  tipo_local?: TipoLocal;

  @ApiPropertyOptional({
    description: 'Dirección específica del local',
    example: 'Pasillo A, Puesto 1',
  })
  @IsString()
  @IsOptional()
  direccion_local?: string;

  @ApiPropertyOptional({
    description: 'Estado del local',
    enum: EstadoLocal,
    example: EstadoLocal.PENDIENTE,
  })
  @IsEnum(EstadoLocal, { message: 'Estado del local debe ser válido' })
  @IsOptional()  estado_local?: EstadoLocal = EstadoLocal.PENDIENTE;

  @ApiPropertyOptional({
    description: 'Monto mensual a pagar',
    example: 150.0,
  })
  @Transform(({ value }) => (value ? parseFloat(value as string) : undefined))
  @IsNumber()
  @IsOptional()
  monto_mensual?: number;

  @ApiPropertyOptional({
    description: 'Nombre del propietario',
    example: 'María García',
  })
  @IsString()
  @IsOptional()
  propietario?: string;

  @ApiPropertyOptional({
    description: 'DNI del propietario',
    example: '87654321',
  })
  @IsString()
  @IsOptional()
  dni_propietario?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+51987654321',
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'maria.garcia@email.com',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Latitud del local',
    example: -12.0464,
  })
  @IsNumber()
  @IsOptional()
  latitud?: number;

  @ApiPropertyOptional({
    description: 'Longitud del local',
    example: -77.0428,
  })
  @IsNumber()
  @IsOptional()
  longitud?: number;

  @ApiProperty({
    description: 'ID del mercado',
    example: 'uuid-del-mercado',
  })
  @IsString()
  mercadoId: string;
}
