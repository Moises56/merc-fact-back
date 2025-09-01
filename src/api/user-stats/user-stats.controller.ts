import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { UserStatsService } from './user-stats.service';
import {
  CreateConsultaLogDto,
  ConsultaLogResponseDto,
} from './dto/consulta-log.dto';
import {
  AssignUserLocationDto,
  UserLocationResponseDto,
} from './dto/user-location.dto';
import {
  GetUserStatsDto,
  UserStatsResponseDto,
  LocationStatsResponseDto,
  GeneralStatsResponseDto,
} from './dto/user-stats.dto';

@ApiTags('User Stats & Logs')
@Controller('api/user-stats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserStatsController {
  constructor(private readonly userStatsService: UserStatsService) {}

  // Endpoints para USER-ADMIN: Gestión de logs y estadísticas

  @Get('general')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas generales del sistema',
    description: 'Solo para ADMIN y USER-ADMIN',
  })
  @ApiResponse({ type: GeneralStatsResponseDto })
  async getGeneralStats(
    @Query() filters: GetUserStatsDto,
  ): Promise<GeneralStatsResponseDto> {
    return this.userStatsService.getGeneralStats(filters);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas de un usuario específico',
    description: 'Solo para ADMIN y USER-ADMIN',
  })
  @ApiResponse({ type: UserStatsResponseDto })
  async getUserStats(
    @Param('userId') userId: string,
    @Query() filters: GetUserStatsDto,
  ): Promise<UserStatsResponseDto> {
    return this.userStatsService.getUserStats(userId, filters);
  }

  @Get('location/:location')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener estadísticas por ubicación',
    description: 'Solo para ADMIN y USER-ADMIN',
  })
  @ApiResponse({ type: LocationStatsResponseDto })
  async getLocationStats(
    @Param('location') location: string,
    @Query() filters: GetUserStatsDto,
  ): Promise<LocationStatsResponseDto> {
    return this.userStatsService.getLocationStats(location, filters);
  }

  @Get('logs')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener logs de consultas con filtros',
    description: 'Solo para ADMIN y USER-ADMIN',
  })
  @ApiResponse({
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: { $ref: '#/components/schemas/ConsultaLogResponseDto' },
        },
        total: { type: 'number' },
      },
    },
  })
  async getConsultaLogs(
    @Query() filters: GetUserStatsDto & { limit?: number; offset?: number },
  ): Promise<{ logs: ConsultaLogResponseDto[]; total: number }> {
    return this.userStatsService.getConsultaLogs(filters);
  }

  @Post('user-location')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar ubicación a un usuario',
    description: 'Solo para ADMIN y USER-ADMIN',
  })
  @ApiResponse({ type: UserLocationResponseDto })
  async assignUserLocation(
    @Body() data: AssignUserLocationDto,
    @Req() req: any,
  ): Promise<UserLocationResponseDto> {
    return this.userStatsService.assignUserLocation(data, req.user.id);
  }

  @Get('locations')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.USER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener todas las ubicaciones con usuarios asignados',
    description:
      'Solo para ADMIN y USER-ADMIN. Lista todas las ubicaciones del sistema con los usuarios asignados a cada una.',
  })
  @ApiResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          locationName: { type: 'string' },
          locationCode: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
          usersCount: { type: 'number' },
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                nombre: { type: 'string' },
                apellido: { type: 'string' },
                correo: { type: 'string' },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
                lastLogin: { type: 'string', format: 'date-time' },
                assignedAt: { type: 'string', format: 'date-time' },
                assignedBy: { type: 'string' },
              },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getAllLocations(): Promise<any[]> {
    return this.userStatsService.getAllLocations();
  }

  @Get('my-stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener mis propias estadísticas',
    description:
      'Cualquier usuario autenticado puede ver sus propias estadísticas',
  })
  @ApiResponse({ type: UserStatsResponseDto })
  async getMyStats(
    @Query() filters: GetUserStatsDto,
    @Req() req: any,
  ): Promise<UserStatsResponseDto> {
    return this.userStatsService.getUserStats(req.user.id, filters);
  }

  // Endpoint interno para registrar logs (usado por los servicios de consulta)
  @Post('log')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar log de consulta (interno)',
    description: 'Endpoint interno para registrar logs de consultas EC/ICS',
  })
  @ApiResponse({ type: ConsultaLogResponseDto })
  async logConsulta(
    @Body() data: CreateConsultaLogDto,
  ): Promise<ConsultaLogResponseDto> {
    return this.userStatsService.logConsulta(data);
  }
}
