import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'Asd.456@',
  })
  @IsString()
  contrasenaActual: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'Asd.456@@',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  contrasenaNueva: string;
}
