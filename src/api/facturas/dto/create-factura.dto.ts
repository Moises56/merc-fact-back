import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoFactura } from '../../../common/enums';
import { Transform } from 'class-transformer';

export class CreateFacturaDto {
  @ApiProperty({
    description: 'Concepto de la factura',
    example: 'Cuota mensual Enero 2025',
  })
  @IsString()
  concepto: string;

  @ApiProperty({
    description: 'Mes de la factura (formato YYYY-MM)',
    example: '2025-01',
  })
  @IsString()
  mes: string;

  @ApiProperty({
    description: 'Año de la factura',
    example: 2025,
  })
  @IsNumber()
  anio: number;

  @ApiProperty({
    description: 'Monto de la factura',
    example: 150.0,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  monto: number;

  @ApiPropertyOptional({
    description: 'Estado de la factura',
    enum: EstadoFactura,
    example: EstadoFactura.PENDIENTE,
  })
  @IsEnum(EstadoFactura, { message: 'Estado debe ser válido' })
  @IsOptional()
  estado?: EstadoFactura = EstadoFactura.PENDIENTE;

  @ApiProperty({
    description: 'Fecha de vencimiento',
    example: '2025-02-15T00:00:00.000Z',
  })
  @IsDateString()
  fecha_vencimiento: string;

  @ApiPropertyOptional({
    description: 'Fecha de pago',
    example: '2025-01-20T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  fecha_pago?: string;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Factura generada automáticamente',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({
    description: 'ID del local',
    example: 'uuid-del-local',
  })
  @IsString()
  localId: string;

  @ApiProperty({
    description: 'ID del usuario que crea la factura',
    example: 'uuid-del-usuario',
  })
  @IsString()
  createdByUserId: string;
}
