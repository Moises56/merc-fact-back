import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MercadosService } from './mercados.service';
import { CreateMercadoDto } from './dto/create-mercado.dto';
import { UpdateMercadoDto } from './dto/update-mercado.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Role } from '../../common/enums';

@ApiTags('mercados')
@Controller('api/mercados')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MercadosController {
  constructor(private readonly mercadosService: MercadosService) {}
  @Post()
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'CREATE', table: 'mercados' })
  @ApiOperation({ summary: 'Crear nuevo mercado' })
  @ApiResponse({
    status: 201,
    description: 'Mercado creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un mercado con ese nombre',
  })
  create(@Body() createMercadoDto: CreateMercadoDto) {
    return this.mercadosService.create(createMercadoDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener lista de mercados' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'activo',
    required: false,
    type: Boolean,
    description: 'Filtrar por estado activo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de mercados obtenida exitosamente',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('activo', new DefaultValuePipe(undefined)) activo?: boolean,
  ) {
    return this.mercadosService.findAll(page, limit, activo);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Obtener estadísticas de mercados' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getMercadoStats() {
    return this.mercadosService.getMercadoStats();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener mercado por ID' })
  @ApiResponse({
    status: 200,
    description: 'Mercado encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Mercado no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.mercadosService.findOne(id);
  }
  @Patch(':id')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'UPDATE', table: 'mercados' })
  @ApiOperation({ summary: 'Actualizar mercado' })
  @ApiResponse({
    status: 200,
    description: 'Mercado actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Mercado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un mercado con ese nombre',
  })
  update(@Param('id') id: string, @Body() updateMercadoDto: UpdateMercadoDto) {
    return this.mercadosService.update(id, updateMercadoDto);
  }
  @Delete(':id')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'DELETE', table: 'mercados' })
  @ApiOperation({ summary: 'Desactivar mercado' })
  @ApiResponse({
    status: 200,
    description: 'Mercado desactivado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Mercado no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar un mercado con locales ocupados',
  })
  remove(@Param('id') id: string) {
    return this.mercadosService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'ACTIVATE', table: 'mercados' })
  @ApiOperation({ summary: 'Activar mercado' })
  @ApiResponse({
    status: 200,
    description: 'Mercado activado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Mercado no encontrado',
  })
  activate(@Param('id') id: string) {
    return this.mercadosService.activate(id);
  }

  @Get(':id/locales')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener locales de un mercado' })
  @ApiQuery({
    name: 'estado',
    required: false,
    type: String,
    description: 'Filtrar por estado del local (DISPONIBLE, OCUPADO, MANTENIMIENTO, PENDIENTE)',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    type: String,
    description: 'Filtrar por tipo del local',
  })
  @ApiResponse({
    status: 200,
    description: 'Locales del mercado obtenidos exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Mercado no encontrado',
  })
  getLocalesByMercado(
    @Param('id') id: string,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.mercadosService.getLocalesByMercado(id, estado, tipo);
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener estadísticas específicas de un mercado' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del mercado obtenidas exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Mercado no encontrado',
  })
  getMercadoStatsById(@Param('id') id: string) {
    return this.mercadosService.getMercadoStatsById(id);
  }
}
