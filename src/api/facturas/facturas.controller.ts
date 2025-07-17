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
import { FacturasService } from './facturas.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { Role, EstadoFactura } from '../../common/enums';
import { User } from '@prisma/client';

@ApiTags('facturas')
@Controller('api/facturas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}
  @Post()
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @AuditLog({ action: 'CREATE', table: 'facturas' })
  @ApiOperation({ summary: 'Crear una nueva factura' })
  @ApiResponse({ status: 201, description: 'Factura creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 409,
    description: 'Ya existe una factura para este local/mes/año',
  })
  create(@Body() createFacturaDto: CreateFacturaDto, @GetUser() user: User) {
    return this.facturasService.create({
      ...createFacturaDto,
      createdByUserId: user.id,
    });
  }

  @Get()
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @AuditLog({ action: 'LIST', table: 'facturas' })
  @ApiOperation({ summary: 'Obtener lista de facturas con paginación' })
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
    enum: EstadoFactura,
    description: 'Filtrar por estado',
  })
  @ApiQuery({
    name: 'localId',
    required: false,
    type: String,
    description: 'Filtrar por local',
  })
  @ApiQuery({
    name: 'mercadoId',
    required: false,
    type: String,
    description: 'Filtrar por mercado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de facturas obtenida exitosamente',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('estado', new ParseEnumPipe(EstadoFactura, { optional: true }))
    estado?: EstadoFactura,
    @Query('localId') localId?: string,
    @Query('mercadoId') mercadoId?: string,
  ) {
    return this.facturasService.findAll(
      page,
      limit,
      estado,
      localId,
      mercadoId,
    );
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'VIEW_STATS', table: 'facturas' })
  @ApiOperation({ summary: 'Obtener estadísticas de facturas' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getStats() {
    return this.facturasService.getFacturaStats();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MARKET, Role.USER)
  @AuditLog({ action: 'VIEW', table: 'facturas' })
  @ApiOperation({ summary: 'Obtener una factura por ID' })
  @ApiResponse({ status: 200, description: 'Factura encontrada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  findOne(@Param('id') id: string) {
    return this.facturasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'UPDATE', table: 'facturas' })
  @ApiOperation({ summary: 'Actualizar una factura' })
  @ApiResponse({ status: 200, description: 'Factura actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  update(@Param('id') id: string, @Body() updateFacturaDto: UpdateFacturaDto) {
    return this.facturasService.update(id, updateFacturaDto);
  }
  @Patch(':id/pay')
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'PAYMENT', table: 'facturas' })
  @ApiOperation({ summary: 'Marcar factura como pagada' })
  @ApiResponse({ status: 200, description: 'Factura marcada como pagada' })
  @ApiResponse({ status: 400, description: 'La factura ya está pagada' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  markAsPaid(@Param('id') id: string) {
    return this.facturasService.markAsPaid(id);
  }

  @Post('massive')
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'MASSIVE_CREATE', table: 'facturas' })
  @ApiOperation({ summary: 'Generar facturas masivas para un mercado' })
  @ApiResponse({ status: 201, description: 'Facturas generadas exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'No hay locales activos en el mercado',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existen facturas para el período especificado',
  })
  generateMassiveInvoices(
    @Body() data: { mercadoId: string; mes: string; anio: number },
    @GetUser() user: User,
  ) {
    return this.facturasService.generateMassiveInvoices(
      data.mercadoId,
      data.mes,
      data.anio,
      user.id,
    );
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'DELETE', table: 'facturas' })
  @ApiOperation({ summary: 'Eliminar una factura' })
  @ApiResponse({ status: 200, description: 'Factura eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Factura no encontrada' })
  remove(@Param('id') id: string) {
    return this.facturasService.remove(id);
  }
}
