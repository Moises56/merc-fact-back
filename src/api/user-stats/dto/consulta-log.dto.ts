import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsDecimal } from 'class-validator';

export enum ConsultaType {
  EC = 'EC',
  ICS = 'ICS',
}

export enum ConsultaSubtype {
  NORMAL = 'normal',
  AMNISTIA = 'amnistia',
}

export enum ConsultaResultado {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export class CreateConsultaLogDto {
  @ApiProperty({ enum: ConsultaType, description: 'Tipo de consulta' })
  @IsEnum(ConsultaType)
  consultaType: ConsultaType;

  @ApiProperty({ enum: ConsultaSubtype, description: 'Subtipo de consulta' })
  @IsEnum(ConsultaSubtype)
  consultaSubtype: ConsultaSubtype;

  @ApiProperty({ description: 'Parámetros de consulta en JSON' })
  @IsString()
  parametros: string;

  @ApiProperty({ enum: ConsultaResultado, description: 'Resultado de la consulta' })
  @IsEnum(ConsultaResultado)
  resultado: ConsultaResultado;

  @ApiProperty({ description: 'Total encontrado si fue exitoso', required: false })
  @IsOptional()
  @IsNumber()
  totalEncontrado?: number;

  @ApiProperty({ description: 'Mensaje de error si falló', required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ description: 'Dirección IP del usuario', required: false })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({ description: 'User Agent del navegador', required: false })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({ description: 'Duración en milisegundos', required: false })
  @IsOptional()
  @IsNumber()
  duracionMs?: number;

  @ApiProperty({ description: 'ID del usuario que hizo la consulta' })
  @IsString()
  userId: string;
}

export class ConsultaLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ConsultaType })
  consultaType: ConsultaType;

  @ApiProperty({ enum: ConsultaSubtype })
  consultaSubtype: ConsultaSubtype;

  @ApiProperty()
  parametros: string;

  @ApiProperty({ enum: ConsultaResultado })
  resultado: ConsultaResultado;

  @ApiProperty({ required: false })
  totalEncontrado?: number;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty({ required: false })
  ip?: string;

  @ApiProperty({ required: false })
  userAgent?: string;

  @ApiProperty({ required: false })
  duracionMs?: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  userLocation?: string;

  @ApiProperty()
  createdAt: Date;
}
