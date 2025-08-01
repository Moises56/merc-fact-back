import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  Logger,
} from '@nestjs/common';
import { ConsultaIcsService } from './consulta-ics.service';
import { GetConsultaICSDto } from './dto/create-consulta-ics.dto';
import { ConsultaICSResponseDto } from './dto/update-consulta-ics.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('consultaICS')
export class ConsultaIcsController {
  private readonly logger = new Logger(ConsultaIcsController.name);

  constructor(private readonly consultaIcsService: ConsultaIcsService) {}

  @Public() // Endpoint público, no requiere autenticación
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getConsultaICS(
    @Query() query: GetConsultaICSDto,
  ): Promise<ConsultaICSResponseDto> {
    this.logger.log(
      `Consulta ICS - Parámetros: ${JSON.stringify({
        ics: query.ics,
        dni: query.dni,
        ubicacion: query.ubicacion || 'No especificada',
        timestamp: new Date().toISOString(),
        endpoint: '/consultaICS'
      })}`,
    );
    
    const resultado = await this.consultaIcsService.getConsultaICS(query);
    
    this.logger.log(
      `Consulta ICS completada - Usuario: ${resultado.nombre} - Total: ${resultado.totalGeneral} - Ubicación: ${query.ubicacion || 'No especificada'}`
    );
    
    return resultado;
  }

  @Public() // Endpoint público para consulta con amnistía
  @Get('amnistia')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getConsultaICSAmnistia(
    @Query() query: GetConsultaICSDto,
  ): Promise<ConsultaICSResponseDto> {
    this.logger.log(
      `Consulta ICS con Amnistía - Parámetros: ${JSON.stringify({
        ics: query.ics,
        dni: query.dni,
        ubicacion: query.ubicacion || 'No especificada',
        timestamp: new Date().toISOString(),
        endpoint: '/consultaICS/amnistia'
      })}`,
    );
    
    const resultado = await this.consultaIcsService.getConsultaICSAmnistia(query);
    
    this.logger.log(
      `Consulta ICS con Amnistía completada - Usuario: ${resultado.nombre} - Total: ${resultado.totalGeneral} - Ubicación: ${query.ubicacion || 'No especificada'} - Amnistía aplicada: ${resultado.amnistiaVigente}`
    );
    
    return resultado;
  }
}