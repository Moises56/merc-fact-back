import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { ConsultaEcService } from './consulta-ec.service';
import { GetConsultaECDto } from './dto/create-consulta-ec.dto';
import { ConsultaECResponseDto } from './dto/update-consulta-ec.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('consultaEC')
export class ConsultaEcController {
  private readonly logger = new Logger(ConsultaEcController.name);

  constructor(private readonly consultaEcService: ConsultaEcService) {}

  @Public() // Endpoint público, no requiere autenticación
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getConsultaEC(
    @Query() query: GetConsultaECDto,
  ): Promise<ConsultaECResponseDto> {
    this.logger.log(
      `Consulta EC - Parámetros: ${JSON.stringify({
        claveCatastral: query.claveCatastral,
        dni: query.dni,
      })}`,
    );
    
    return this.consultaEcService.getConsultaEC(query);
  }

  @Public() // Endpoint público para consulta con amnistía
  @Get('amnistia')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getConsultaECAmnistia(
    @Query() query: GetConsultaECDto,
  ): Promise<ConsultaECResponseDto> {
    this.logger.log(
      `Consulta EC con Amnistía - Parámetros: ${JSON.stringify({
        claveCatastral: query.claveCatastral,
        dni: query.dni,
      })}`,
    );
    
    return this.consultaEcService.getConsultaECAmnistia(query);
  }
}
