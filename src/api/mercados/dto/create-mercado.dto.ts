import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMercadoDto {
  @ApiProperty({
    description: 'Nombre del mercado',
    example: 'Mercado Central San Juan',
  })
  @IsString()
  nombre_mercado: string;

  @ApiProperty({
    description: 'Dirección del mercado',
    example: 'Av. Principal 123, San Juan de Lurigancho',
  })
  @IsString()
  direccion: string;

  @ApiProperty({
    description: 'Latitud geográfica',
    example: -12.0464,
  })
  @IsNumber()
  latitud: number;

  @ApiProperty({
    description: 'Longitud geográfica',
    example: -77.0428,
  })
  @IsNumber()
  longitud: number;

  @ApiPropertyOptional({
    description: 'Descripción del mercado',
    example: 'Mercado municipal con 150 puestos comerciales',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
