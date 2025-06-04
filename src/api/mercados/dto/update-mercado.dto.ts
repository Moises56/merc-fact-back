import { PartialType } from '@nestjs/swagger';
import { CreateMercadoDto } from './create-mercado.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMercadoDto extends PartialType(CreateMercadoDto) {
  @ApiPropertyOptional({
    description: 'Estado activo del mercado',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
