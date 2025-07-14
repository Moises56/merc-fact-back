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
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LocalesService } from './locales.service';
import { CreateLocaleDto } from './dto/create-local.dto';
import { UpdateLocalDto } from './dto/update-local.dto';
import { LocalStatsResponseDto } from './dto/local-stats-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, EstadoLocal, TipoLocal } from '../../common/enums';

@ApiTags('locales')
@Controller('api/locales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LocalesController {
  constructor(private readonly localesService: LocalesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Crear un nuevo local comercial' })
  @ApiResponse({ status: 201, description: 'Local creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un local con ese número o permiso',
  })
  create(@Body() createLocaleDto: CreateLocaleDto) {
    return this.localesService.create(createLocaleDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({
    summary: 'Obtener lista de locales con paginación y filtros',
  })
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
    name: 'estado',
    required: false,
    enum: EstadoLocal,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: TipoLocal,
    description: 'Filtrar por tipo',
  })
  @ApiQuery({
    name: 'mercadoId',
    required: false,
    type: String,
    description: 'Filtrar por mercado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de locales obtenida exitosamente',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('estado', new ParseEnumPipe(EstadoLocal, { optional: true }))
    estado?: EstadoLocal,
    @Query('tipo', new ParseEnumPipe(TipoLocal, { optional: true }))
    tipo?: TipoLocal,
    @Query('mercadoId') mercadoId?: string,
  ) {
    return this.localesService.findAll(page, limit, estado, tipo, mercadoId);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Obtener estadísticas de locales' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getStats() {
    return this.localesService.getLocalStats();
  }

  @Get(':id/stats')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener estadísticas de un local específico' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del local obtenidas exitosamente',
    type: LocalStatsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  getLocalStats(@Param('id') id: string) {
    return this.localesService.getLocalStatsById(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener un local por ID' })
  @ApiResponse({ status: 200, description: 'Local encontrado' })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  findOne(@Param('id') id: string) {
    return this.localesService.findOne(id);
  }

  @Get(':id/facturas')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @ApiOperation({ summary: 'Obtener facturas de un local específico' })
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
  @ApiResponse({
    status: 200,
    description: 'Facturas del local obtenidas exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  getFacturas(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.localesService.getFacturasByLocal(id, page, limit);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Actualizar un local' })
  @ApiResponse({ status: 200, description: 'Local actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Conflicto con número de local o permiso',
  })
  update(@Param('id') id: string, @Body() updateLocaleDto: UpdateLocalDto) {
    return this.localesService.update(id, updateLocaleDto);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Activar un local' })
  @ApiResponse({ status: 200, description: 'Local activado exitosamente' })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  activate(@Param('id') id: string) {
    return this.localesService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Desactivar un local' })
  @ApiResponse({ status: 200, description: 'Local desactivado exitosamente' })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  deactivate(@Param('id') id: string) {
    return this.localesService.deactivate(id);
  }

  @Patch(':id/suspend')
  @Roles(Role.ADMIN, Role.MARKET)
  @ApiOperation({ summary: 'Suspender un local' })
  @ApiResponse({ status: 200, description: 'Local suspendido exitosamente' })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  suspend(@Param('id') id: string) {
    return this.localesService.suspend(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Eliminar un local' })
  @ApiResponse({ status: 200, description: 'Local eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Local no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'No se puede eliminar: tiene facturas asociadas',
  })
  remove(@Param('id') id: string) {
    return this.localesService.remove(id);
  }
}
