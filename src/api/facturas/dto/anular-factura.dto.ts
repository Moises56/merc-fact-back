import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnularFacturaDto {
  @ApiProperty({
    description: 'Razón por la cual se anula la factura',
    example: 'Factura creada por error en el mes incorrecto',
    minLength: 10,
    maxLength: 500,
  })
  @IsString({ message: 'La razón debe ser un texto válido' })
  @IsNotEmpty({ message: 'La razón de anulación es obligatoria' })
  @MinLength(10, {
    message: 'La razón debe tener al menos 10 caracteres para ser descriptiva',
  })
  @MaxLength(500, {
    message: 'La razón no puede exceder 500 caracteres',
  })
  razon_anulacion: string;
}
