import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    example: 'mougrind@amdc.hn',
    description:
      'Correo electrónico del usuario (requerido si no se proporciona username)',
  })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @IsOptional()
  @ValidateIf((o: LoginDto) => !o.username)
  correo?: string;

  @ApiPropertyOptional({
    example: 'mougrind',
    description: 'Nombre de usuario (requerido si no se proporciona correo)',
  })
  @IsString({ message: 'El username debe ser una cadena de texto' })
  @IsOptional()
  @ValidateIf((o: LoginDto) => !o.correo)
  username?: string;

  @ApiProperty({
    example: 'Asd.456@',
    description: 'Contraseña del usuario',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de actualización',
  })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El token de actualización es obligatorio' })
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Contraseña actual',
    minLength: 6,
  })
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  currentPassword: string;

  @ApiProperty({
    description: 'Nueva contraseña',
    minLength: 6,
  })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  newPassword: string;
}
