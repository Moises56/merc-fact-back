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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { ConsultaLogInterceptor } from '../user-stats/consulta-log.interceptor';
import { ConsultaIcsService } from '../../consulta-ics/consulta-ics.service';
import { ConsultaEcService } from '../../consulta-ec/consulta-ec.service';
import { GetConsultaICSDto } from '../../consulta-ics/dto/create-consulta-ics.dto';
import { GetConsultaECDto } from '../../consulta-ec/dto/create-consulta-ec.dto';
import { ConsultaICSResponseDto } from '../../consulta-ics/dto/update-consulta-ics.dto';
import { ConsultaECResponseDto } from '../../consulta-ec/dto/update-consulta-ec.dto';

@ApiTags('Consultas Autenticadas')
@Controller('api/consultas-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ConsultaLogInterceptor)
@ApiBearerAuth()
export class ConsultasAuthController {
  private readonly logger = new Logger(ConsultasAuthController.name);

  constructor(
    private readonly consultaIcsService: ConsultaIcsService,
    private readonly consultaEcService: ConsultaEcService,
  ) {}

  // Endpoints ICS autenticados
  @Get('ics')
  @Roles(Role.USER, Role.ADMIN, Role.USER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta ICS autenticada',
    description: 'Consulta ICS con logging automático del usuario',
  })
  async getConsultaICS(
    @Query() query: GetConsultaICSDto,
    @Req() req: any,
  ): Promise<ConsultaICSResponseDto> {
    this.logger.log(
      `Consulta ICS autenticada - Usuario: ${req.user.username} - Parámetros: ${JSON.stringify({
        ics: query.ics,
        dni: query.dni,
      })}`,
    );

    return this.consultaIcsService.getConsultaICS(query);
  }

  @Get('ics/amnistia')
  @Roles(Role.USER, Role.ADMIN, Role.USER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta ICS con amnistía autenticada',
    description: 'Consulta ICS con amnistía y logging automático del usuario',
  })
  async getConsultaICSAmnistia(
    @Query() query: GetConsultaICSDto,
    @Req() req: any,
  ): Promise<ConsultaICSResponseDto> {
    this.logger.log(
      `Consulta ICS amnistía autenticada - Usuario: ${req.user.username} - Parámetros: ${JSON.stringify({
        ics: query.ics,
        dni: query.dni,
      })}`,
    );

    return this.consultaIcsService.getConsultaICSAmnistia(query);
  }

  // Endpoints EC autenticados
  @Get('ec')
  @Roles(Role.USER, Role.ADMIN, Role.USER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta EC autenticada',
    description: 'Consulta EC con logging automático del usuario',
  })
  async getConsultaEC(
    @Query() query: GetConsultaECDto,
    @Req() req: any,
  ): Promise<ConsultaECResponseDto> {
    this.logger.log(
      `Consulta EC autenticada - Usuario: ${req.user.username} - Parámetros: ${JSON.stringify({
        dni: query.dni,
        claveCatastral: query.claveCatastral,
      })}`,
    );

    return this.consultaEcService.getConsultaEC(query);
  }

  @Get('ec/amnistia')
  @Roles(Role.USER, Role.ADMIN, Role.USER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Consulta EC con amnistía autenticada',
    description: 'Consulta EC con amnistía y logging automático del usuario',
  })
  async getConsultaECAmnistia(
    @Query() query: GetConsultaECDto,
    @Req() req: any,
  ): Promise<ConsultaECResponseDto> {
    this.logger.log(
      `Consulta EC amnistía autenticada - Usuario: ${req.user.username} - Parámetros: ${JSON.stringify({
        dni: query.dni,
        claveCatastral: query.claveCatastral,
      })}`,
    );

    return this.consultaEcService.getConsultaECAmnistia(query);
  }
}
