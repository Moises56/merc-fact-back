import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty({
    description: 'Acción realizada',
    example: 'CREATE',
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'],
  })
  @IsString()
  accion: string;

  @ApiProperty({
    description: 'Tabla afectada',
    example: 'users',
    enum: ['users', 'mercados', 'locales', 'facturas'],
  })
  @IsString()
  tabla: string;

  @ApiProperty({
    description: 'ID del usuario que realizó la acción',
    example: 'uuid-del-usuario',
  })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'ID del registro afectado',
    example: 'uuid-del-registro',
  })
  @IsOptional()
  @IsString()
  registroId?: string;

  @ApiPropertyOptional({
    description: 'Datos anteriores en formato JSON',
    example: '{"nombre": "Valor anterior"}',
  })
  @IsOptional()
  @IsString()
  datosAntes?: string;

  @ApiPropertyOptional({
    description: 'Datos nuevos en formato JSON',
    example: '{"nombre": "Valor nuevo"}',
  })
  @IsOptional()
  @IsString()
  datosDespues?: string;

  @ApiPropertyOptional({
    description: 'Dirección IP del usuario',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({
    description: 'User Agent del navegador',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
