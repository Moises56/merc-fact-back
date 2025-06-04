import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums';

export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'mougrind@amdc.hn',
  })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  correo: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Mou',
  })
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Grind',
  })
  @IsString()
  apellido: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Asd.456@',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena: string;

  @ApiPropertyOptional({
    description: 'Teléfono del usuario',
    example: '+51987654321',
  })
  @IsString()
  @IsOptional()
  telefono?: string;

  @ApiProperty({
    description: 'DNI del usuario',
    example: '12345678',
  })
  @IsString()
  dni: string;

  @ApiPropertyOptional({
    description: 'Gerencia a la que pertenece',
    example: 'Desarrollo Económico Local',
  })
  @IsString()
  @IsOptional()
  gerencia?: string;

  @ApiPropertyOptional({
    description: 'Número de empleado',
    example: 11056,
  })
  @IsNumber()
  @IsOptional()
  numero_empleado?: number;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: Role,
    example: Role.ADMIN,
  })
  @IsEnum(Role, { message: 'El rol debe ser USER, ADMIN o MARKET' })
  @IsOptional()
  role?: Role = Role.ADMIN;

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'mougrind',
  })
  @IsString({ message: 'El username debe ser una cadena de texto' })
  @MinLength(3, { message: 'El username debe tener al menos 3 caracteres' })
  username: string;
}
