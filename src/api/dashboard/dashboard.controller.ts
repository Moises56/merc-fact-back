import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('Dashboard')
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'VIEW_STATISTICS', table: 'dashboard' })
  @ApiOperation({ 
    summary: 'Obtener estadísticas del dashboard',
    description: 'Retorna métricas financieras, de facturación y entidades del sistema'
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
    type: DashboardStatisticsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async getStatistics(): Promise<DashboardStatisticsDto> {
    try {
      return await this.dashboardService.getStatistics();
    } catch (error) {
      console.error('Error getting dashboard statistics:', error);
      throw error;
    }
  }
}
