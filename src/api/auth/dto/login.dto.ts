import { IsString, MinLength, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiPropertyOptional({
    description:
      'Correo electrónico del usuario (requerido si no se proporciona username)',
    example: 'mougrind@amdc.hn',
  })
  @IsString({ message: 'El correo debe ser una cadena de texto' })
  @IsOptional()
  @ValidateIf((o) => !o.username)
  correo?: string;

  @ApiPropertyOptional({
    description: 'Nombre de usuario (requerido si no se proporciona correo)',
    example: 'mougrind',
  })
  @IsString({ message: 'El username debe ser una cadena de texto' })
  @IsOptional()
  @ValidateIf((o) => !o.correo)
  username?: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Asd.456@',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de actualización',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    example: 'Asd.456@',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    example: 'NewPassword123@',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;
}
