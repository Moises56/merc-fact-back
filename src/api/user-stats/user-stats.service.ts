import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateConsultaLogDto,
  ConsultaLogResponseDto,
  ConsultaType,
  ConsultaSubtype,
  ConsultaResultado,
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
  StatsTimeRange,
} from './dto/user-stats.dto';

@Injectable()
export class UserStatsService {
  private readonly logger = new Logger(UserStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Registrar log de consulta
  async logConsulta(data: CreateConsultaLogDto): Promise<ConsultaLogResponseDto> {
    try {
      const log = await this.prisma.consultaLog.create({
        data: {
          consultaType: data.consultaType,
          consultaSubtype: data.consultaSubtype,
          parametros: data.parametros,
          resultado: data.resultado,
          totalEncontrado: data.totalEncontrado,
          errorMessage: data.errorMessage,
          ip: data.ip,
          userAgent: data.userAgent,
          duracionMs: data.duracionMs,
          userId: data.userId,
        },
        include: {
          user: {
            include: {
              userLocations: {
                where: { isActive: true },
                select: { locationName: true },
              },
            },
          },
        },
      });

      return {
        id: log.id,
        consultaType: log.consultaType as ConsultaType,
        consultaSubtype: log.consultaSubtype as ConsultaSubtype,
        parametros: log.parametros,
        resultado: log.resultado as ConsultaResultado,
        totalEncontrado: log.totalEncontrado?.toNumber(),
        errorMessage: log.errorMessage || undefined,
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined,
        duracionMs: log.duracionMs || undefined,
        userId: log.userId,
        username: log.user.username,
        userLocation: log.user.userLocations[0]?.locationName,
        createdAt: log.createdAt,
      };
    } catch (error) {
      this.logger.error(`Error al registrar log de consulta: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Asignar ubicación a usuario
  async assignUserLocation(
    data: AssignUserLocationDto,
    assignedByUserId: string,
  ): Promise<UserLocationResponseDto> {
    try {
      // Desactivar ubicación anterior si existe
      await this.prisma.userLocation.updateMany({
        where: {
          userId: data.userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Crear nueva ubicación
      const location = await this.prisma.userLocation.create({
        data: {
          userId: data.userId,
          locationName: data.locationName,
          locationCode: data.locationCode,
          description: data.description,
          assignedBy: assignedByUserId,
          isActive: true,
        },
        include: {
          user: {
            select: { username: true },
          },
        },
      });

      return {
        id: location.id,
        locationName: location.locationName,
        locationCode: location.locationCode || undefined,
        description: location.description || undefined,
        isActive: location.isActive,
        assignedAt: location.assignedAt,
        assignedBy: location.assignedBy || undefined,
        userId: location.userId,
        username: location.user.username,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
      };
    } catch (error) {
      this.logger.error(`Error al asignar ubicación: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Obtener estadísticas de usuario específico
  async getUserStats(
    userId: string,
    filters: GetUserStatsDto,
  ): Promise<UserStatsResponseDto> {
    try {
      const dateRange = this.getDateRange(filters);

      const [user, logs, totalRecaudado] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            userLocations: {
              where: { isActive: true },
              select: { locationName: true },
            },
          },
        }),
        this.prisma.consultaLog.findMany({
          where: {
            userId,
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.consultaLog.aggregate({
          where: {
            userId,
            resultado: 'SUCCESS',
            totalEncontrado: { not: null },
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
          _sum: { totalEncontrado: true },
        }),
      ]);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const totalConsultas = logs.length;
      const consultasEC = logs.filter(l => l.consultaType === 'EC').length;
      const consultasICS = logs.filter(l => l.consultaType === 'ICS').length;
      const consultasExitosas = logs.filter(l => l.resultado === 'SUCCESS').length;
      const consultasConError = logs.filter(l => l.resultado === 'ERROR').length;
      const consultasNoEncontradas = logs.filter(l => l.resultado === 'NOT_FOUND').length;

      const tiemposRespuesta = logs
        .filter(l => l.duracionMs !== null)
        .map(l => l.duracionMs!);
      const promedioTiempoRespuesta = tiemposRespuesta.length > 0
        ? tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length
        : 0;

      return {
        userId: user.id,
        username: user.username,
        userLocation: user.userLocations[0]?.locationName,
        totalConsultas,
        consultasEC,
        consultasICS,
        consultasExitosas,
        consultasConError,
        consultasNoEncontradas,
        promedioTiempoRespuesta,
        totalRecaudadoConsultado: totalRecaudado._sum.totalEncontrado?.toNumber() || 0,
        ultimaConsulta: logs[0]?.createdAt,
        periodoConsultado: this.formatDateRange(dateRange),
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas de usuario: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Obtener estadísticas por ubicación
  async getLocationStats(
    location: string,
    filters: GetUserStatsDto,
  ): Promise<LocationStatsResponseDto> {
    try {
      const dateRange = this.getDateRange(filters);

      const usuarios = await this.prisma.user.findMany({
        where: {
          userLocations: {
            some: {
              locationName: location,
              isActive: true,
            },
          },
        },
        include: {
          consultaLogs: {
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
          },
        },
      });

      const usuariosStats: UserStatsResponseDto[] = [];
      let totalConsultas = 0;
      let consultasEC = 0;
      let consultasICS = 0;

      for (const usuario of usuarios) {
        const userStats = await this.getUserStats(usuario.id, filters);
        usuariosStats.push(userStats);
        totalConsultas += userStats.totalConsultas;
        consultasEC += userStats.consultasEC;
        consultasICS += userStats.consultasICS;
      }

      return {
        location,
        totalUsuarios: usuarios.length,
        totalConsultas,
        consultasEC,
        consultasICS,
        promedioConsultasPorUsuario: usuarios.length > 0 ? totalConsultas / usuarios.length : 0,
        usuariosStats,
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas por ubicación: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Obtener estadísticas generales
  async getGeneralStats(filters: GetUserStatsDto): Promise<GeneralStatsResponseDto> {
    try {
      const dateRange = this.getDateRange(filters);

      const [totalUsuarios, consultaLogs, ubicaciones] = await Promise.all([
        this.prisma.user.count({
          where: { role: 'USER' },
        }),
        this.prisma.consultaLog.findMany({
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            },
          },
          include: {
            user: {
              include: {
                userLocations: {
                  where: { isActive: true },
                  select: { locationName: true },
                },
              },
            },
          },
        }),
        this.prisma.userLocation.findMany({
          where: { isActive: true },
          select: { locationName: true },
          distinct: ['locationName'],
        }),
      ]);

      const usuariosActivos = new Set(consultaLogs.map(log => log.userId)).size;
      const totalConsultas = consultaLogs.length;

      const consultasPorTipo = {
        EC: consultaLogs.filter(l => l.consultaType === 'EC').length,
        ICS: consultaLogs.filter(l => l.consultaType === 'ICS').length,
      };

      const consultasPorResultado = {
        SUCCESS: consultaLogs.filter(l => l.resultado === 'SUCCESS').length,
        ERROR: consultaLogs.filter(l => l.resultado === 'ERROR').length,
        NOT_FOUND: consultaLogs.filter(l => l.resultado === 'NOT_FOUND').length,
      };

      // Estadísticas por ubicación
      const estatsPorUbicacion: LocationStatsResponseDto[] = [];
      for (const ubicacion of ubicaciones) {
        const locationStats = await this.getLocationStats(ubicacion.locationName, filters);
        estatsPorUbicacion.push(locationStats);
      }

      // Top 10 usuarios más activos
      const usuariosConConsultas = new Map<string, number>();
      consultaLogs.forEach(log => {
        usuariosConConsultas.set(log.userId, (usuariosConConsultas.get(log.userId) || 0) + 1);
      });

      const topUsuariosIds = Array.from(usuariosConConsultas.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      const topUsuarios: UserStatsResponseDto[] = [];
      for (const userId of topUsuariosIds) {
        const userStats = await this.getUserStats(userId, filters);
        topUsuarios.push(userStats);
      }

      return {
        totalUsuarios,
        usuariosActivos,
        totalConsultas,
        consultasPorTipo,
        consultasPorResultado,
        estatsPorUbicacion,
        topUsuarios,
      };
    } catch (error) {
      this.logger.error(`Error al obtener estadísticas generales: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Obtener logs de consultas con filtros
  async getConsultaLogs(
    filters: GetUserStatsDto & { limit?: number; offset?: number },
  ): Promise<{ logs: ConsultaLogResponseDto[]; total: number }> {
    try {
      const dateRange = this.getDateRange(filters);
      const { limit = 50, offset = 0 } = filters;

      const where = {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(filters.userId && { userId: filters.userId }),
      };

      const [logs, total] = await Promise.all([
        this.prisma.consultaLog.findMany({
          where,
          include: {
            user: {
              include: {
                userLocations: {
                  where: { isActive: true },
                  select: { locationName: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.consultaLog.count({ where }),
      ]);

      const logsResponse: ConsultaLogResponseDto[] = logs.map(log => ({
        id: log.id,
        consultaType: log.consultaType as ConsultaType,
        consultaSubtype: log.consultaSubtype as ConsultaSubtype,
        parametros: log.parametros,
        resultado: log.resultado as ConsultaResultado,
        totalEncontrado: log.totalEncontrado?.toNumber(),
        errorMessage: log.errorMessage || undefined,
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined,
        duracionMs: log.duracionMs || undefined,
        userId: log.userId,
        username: log.user.username,
        userLocation: log.user.userLocations[0]?.locationName,
        createdAt: log.createdAt,
      }));

      return { logs: logsResponse, total };
    } catch (error) {
      this.logger.error(`Error al obtener logs de consultas: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getDateRange(filters: GetUserStatsDto) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (filters.timeRange === StatsTimeRange.CUSTOM && filters.startDate && filters.endDate) {
      start = new Date(filters.startDate);
      end = new Date(filters.endDate);
    } else {
      switch (filters.timeRange) {
        case StatsTimeRange.DAY:
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case StatsTimeRange.WEEK:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case StatsTimeRange.YEAR:
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case StatsTimeRange.MONTH:
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    return { start, end };
  }

  private formatDateRange(dateRange: { start: Date; end: Date }): string {
    const formatDate = (date: Date) => date.toLocaleDateString('es-HN');
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  }
}
