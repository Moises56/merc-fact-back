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
import { ConsultaEcService } from './consulta-ec.service';
import { GetConsultaECDto } from './dto/create-consulta-ec.dto';
import { ConsultaECResponseDto } from './dto/update-consulta-ec.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConsultaLogInterceptor } from '../common/interceptors/consulta-log.interceptor';

@UseGuards(JwtAuthGuard) // Aplicar autenticación a todo el controlador
@UseInterceptors(ConsultaLogInterceptor) // Aplicar logging a todo el controlador
@Controller('consultaEC')
export class ConsultaEcController {
  private readonly logger = new Logger(ConsultaEcController.name);

  constructor(private readonly consultaEcService: ConsultaEcService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta EC (requiere autenticación)',
  })
  @ApiBearerAuth()
  async getConsultaEC(
    @Query() query: GetConsultaECDto,
    @Req() req: any,
  ): Promise<ConsultaECResponseDto> {
    this.logger.log(
      `Consulta EC - Usuario: ${req.user?.username} - Parámetros: ${JSON.stringify(
        {
          claveCatastral: query.claveCatastral,
          dni: query.dni,
          timestamp: new Date().toISOString(),
          endpoint: '/consultaEC',
        },
      )}`,
    );

    return this.consultaEcService.getConsultaEC(query);
  }

  @Get('amnistia')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta EC con amnistía (requiere autenticación)',
  })
  @ApiBearerAuth()
  async getConsultaECAmnistia(
    @Query() query: GetConsultaECDto,
    @Req() req: any,
  ): Promise<ConsultaECResponseDto> {
    this.logger.log(
      `Consulta EC con Amnistía - Usuario: ${req.user?.username} - Parámetros: ${JSON.stringify(
        {
          claveCatastral: query.claveCatastral,
          dni: query.dni,
          timestamp: new Date().toISOString(),
          endpoint: '/consultaEC/amnistia',
        },
      )}`,
    );

    return this.consultaEcService.getConsultaECAmnistia(query);
  }
}
