import {
  Controller,
  Get,
  Query,
  ValidationPipe,
  UsePipes,
  Logger,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultaIcsService } from './consulta-ics.service';
import { GetConsultaICSDto } from './dto/create-consulta-ics.dto';
import { ConsultaICSResponseDto } from './dto/update-consulta-ics.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConsultaLogInterceptor } from '../common/interceptors/consulta-log.interceptor';

@UseGuards(JwtAuthGuard) // Aplicar autenticación a todo el controlador
@UseInterceptors(ConsultaLogInterceptor) // Aplicar logging a todo el controlador
@Controller('consultaICS')
export class ConsultaIcsController {
  private readonly logger = new Logger(ConsultaIcsController.name);

  constructor(private readonly consultaIcsService: ConsultaIcsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta ICS (requiere autenticación)',
  })
  @ApiBearerAuth()
  async getConsultaICS(
    @Query() query: GetConsultaICSDto,
    @Req() req: any,
  ): Promise<ConsultaICSResponseDto> {
    this.logger.log(
      `Consulta ICS - Usuario: ${req.user?.username} - Parámetros: ${JSON.stringify(
        {
          ics: query.ics,
          dni: query.dni,
          timestamp: new Date().toISOString(),
          endpoint: '/consultaICS',
        },
      )}`,
    );

    const resultado = await this.consultaIcsService.getConsultaICS(query);

    this.logger.log(
      `Consulta ICS completada - Usuario: ${resultado.nombre} - Total: ${resultado.totalGeneral}`,
    );

    return resultado;
  }

  @Get('amnistia')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta ICS con amnistía (requiere autenticación)',
  })
  @ApiBearerAuth()
  async getConsultaICSAmnistia(
    @Query() query: GetConsultaICSDto,
    @Req() req: any,
  ): Promise<ConsultaICSResponseDto> {
    this.logger.log(
      `Consulta ICS con Amnistía - Usuario: ${req.user?.username} - Parámetros: ${JSON.stringify(
        {
          ics: query.ics,
          dni: query.dni,
          timestamp: new Date().toISOString(),
          endpoint: '/consultaICS/amnistia',
        },
      )}`,
    );

    const resultado =
      await this.consultaIcsService.getConsultaICSAmnistia(query);

    this.logger.log(
      `Consulta ICS con Amnistía completada - Usuario: ${resultado.nombre} - Total: ${resultado.totalGeneral} - Amnistía aplicada: ${resultado.amnistiaVigente}`,
    );

    return resultado;
  }
}
