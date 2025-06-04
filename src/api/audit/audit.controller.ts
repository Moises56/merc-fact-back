import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Crear registro de auditoría manual' })
  @ApiResponse({
    status: 201,
    description: 'Registro de auditoría creado exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async create(@Body() createAuditDto: CreateAuditDto) {
    try {
      return await this.auditService.create(createAuditDto);
    } catch (_error) {
      throw new HttpException(
        'Error al crear registro de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles(Role.ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Obtener todos los registros de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros de auditoría',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'accion', required: false, type: String })
  @ApiQuery({ name: 'tabla', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('accion') accion?: string,
    @Query('tabla') tabla?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      return await this.auditService.findAll(
        pageNum,
        limitNum,
        accion,
        tabla,
        userId,
        start,
        end,
      );
    } catch (_error) {
      throw new HttpException(
        'Error al obtener registros de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de auditoría',
  })
  async getStats() {
    try {
      return await this.auditService.getAuditStats();
    } catch (_error) {
      throw new HttpException(
        'Error al obtener estadísticas de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Obtener registros de auditoría por usuario' })
  @ApiResponse({
    status: 200,
    description: 'Registros de auditoría del usuario',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      return await this.auditService.findByUser(userId, pageNum, limitNum);
    } catch (_error) {
      throw new HttpException(
        'Error al obtener registros de auditoría del usuario',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.AUDITOR)
  @ApiOperation({ summary: 'Obtener registro de auditoría específico' })
  @ApiResponse({
    status: 200,
    description: 'Registro de auditoría encontrado',
  })
  @ApiResponse({ status: 404, description: 'Registro no encontrado' })
  async findOne(@Param('id') id: string) {
    try {
      const auditLog = await this.auditService.findOne(id);
      if (!auditLog) {
        throw new HttpException(
          'Registro de auditoría no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }
      return auditLog;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al obtener registro de auditoría',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
