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
  UserLocationHistoryResponseDto,
  UserLocationHistoryItemDto,
  GetUserLocationHistoryDto,
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
  async logConsulta(
    data: CreateConsultaLogDto,
  ): Promise<ConsultaLogResponseDto> {
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
      this.logger.error(
        `Error al registrar log de consulta: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Asignar ubicación a usuario
  async assignUserLocation(
    data: AssignUserLocationDto,
    assignedByUserId: string,
  ): Promise<UserLocationResponseDto> {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          username: true,
          nombre: true,
          apellido: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Obtener la ubicación actual antes de cambiarla (para logging)
      const currentLocation = await this.prisma.userLocation.findFirst({
        where: {
          userId: data.userId,
          isActive: true,
        },
      });

      const assignmentDate = new Date();

      // Usar transacción para garantizar consistencia
      const location = await this.prisma.$transaction(async (prisma) => {
        // Desactivar ubicación anterior si existe
        if (currentLocation) {
          await prisma.userLocation.update({
            where: {
              id: currentLocation.id,
            },
            data: {
              isActive: false,
              updatedAt: assignmentDate,
            },
          });

          this.logger.log(
            `Ubicación anterior desactivada para usuario ${user.username} (${data.userId}): ${currentLocation.locationName} -> ${data.locationName}`,
          );
        }

        // Crear nueva ubicación
        const newLocation = await prisma.userLocation.create({
          data: {
            userId: data.userId,
            locationName: data.locationName,
            locationCode: data.locationCode,
            description: data.description,
            assignedBy: assignedByUserId,
            isActive: true,
            assignedAt: assignmentDate,
          },
          include: {
            user: {
              select: { username: true },
            },
          },
        });

        return newLocation;
      });

      // Log del cambio exitoso
      this.logger.log(
        `Nueva ubicación asignada exitosamente - Usuario: ${user.username} (${data.userId}), Ubicación: ${data.locationName} (${data.locationCode || 'Sin código'}), Asignado por: ${assignedByUserId}`,
      );

      // Log para auditoría del historial
      this.logger.log(
        `HISTORIAL_UBICACION: {"userId":"${data.userId}","username":"${user.username}","previousLocation":"${currentLocation?.locationName || 'Ninguna'}","newLocation":"${data.locationName}","assignedBy":"${assignedByUserId}","timestamp":"${assignmentDate.toISOString()}"}`,
      );

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
      this.logger.error(
        `Error al asignar ubicación - Usuario: ${data.userId}, Ubicación: ${data.locationName}, Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Obtener historial de ubicaciones de un usuario
  async getUserLocationHistory(
    userId: string,
    options?: GetUserLocationHistoryDto,
  ): Promise<UserLocationHistoryResponseDto> {
    try {
      // Verificar que el usuario existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          nombre: true,
          apellido: true,
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const {
        activeOnly = false,
        sortOrder = 'desc',
        limit = 50,
        page = 1,
      } = options || {};
      const skip = (page - 1) * limit;

      // Construir filtros
      const whereClause: any = { userId };
      if (activeOnly) {
        whereClause.isActive = true;
      }

      // Obtener ubicaciones del usuario
      const userLocations = await this.prisma.userLocation.findMany({
        where: whereClause,
        orderBy: {
          assignedAt: sortOrder,
        },
        skip,
        take: limit,
      });

      // Obtener información adicional para calcular duraciones
      const allUserLocations = await this.prisma.userLocation.findMany({
        where: { userId },
        orderBy: { assignedAt: 'asc' },
      });

      // Procesar ubicaciones para calcular duraciones
      const locationHistory: UserLocationHistoryItemDto[] = userLocations.map(
        (location) => {
          let durationDays: number | undefined;
          let deactivatedAt: Date | undefined;

          if (!location.isActive) {
            // Buscar la siguiente ubicación para calcular duración
            const currentIndex = allUserLocations.findIndex(
              (loc) => loc.id === location.id,
            );
            if (
              currentIndex !== -1 &&
              currentIndex < allUserLocations.length - 1
            ) {
              const nextLocation = allUserLocations[currentIndex + 1];
              deactivatedAt = nextLocation.assignedAt;
              durationDays = Math.ceil(
                (nextLocation.assignedAt.getTime() -
                  location.assignedAt.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
            }
          } else {
            // Para ubicación activa, calcular días desde asignación
            durationDays = Math.ceil(
              (new Date().getTime() - location.assignedAt.getTime()) /
                (1000 * 60 * 60 * 24),
            );
          }

          return {
            id: location.id,
            locationName: location.locationName,
            locationCode: location.locationCode ?? undefined,
            description: location.description ?? undefined,
            isActive: location.isActive,
            assignedAt: location.assignedAt,
            assignedBy: location.assignedBy ?? undefined,
            assignedByUsername: location.assignedBy ?? undefined, // TODO: Obtener username real del assignedBy
            createdAt: location.createdAt,
            updatedAt: location.updatedAt,
            durationDays,
            deactivatedAt,
          };
        },
      );

      // Obtener ubicación actual
      const currentLocation = locationHistory.find((loc) => loc.isActive);

      // Calcular estadísticas
      const totalLocations = await this.prisma.userLocation.count({
        where: { userId },
      });

      const firstLocation = allUserLocations[0];
      const lastLocation = allUserLocations[allUserLocations.length - 1];

      return {
        userId: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        currentLocation,
        locationHistory,
        totalLocations,
        firstAssignedAt: firstLocation?.assignedAt,
        lastAssignedAt: lastLocation?.assignedAt,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener historial de ubicaciones: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Obtener historial de ubicaciones de todos los usuarios
  async getAllUsersLocationHistory(
    options?: GetUserLocationHistoryDto,
  ): Promise<UserLocationHistoryResponseDto[]> {
    try {
      const {
        activeOnly = false,
        sortOrder = 'desc',
        limit = 50,
        page = 1,
      } = options || {};
      const skip = (page - 1) * limit;

      // Obtener usuarios con ubicaciones
      const usersWithLocations = await this.prisma.user.findMany({
        where: {
          userLocations: {
            some: activeOnly ? { isActive: true } : {},
          },
        },
        select: {
          id: true,
          username: true,
          nombre: true,
          apellido: true,
        },
        skip,
        take: limit,
      });

      // Obtener historial para cada usuario
      const results: UserLocationHistoryResponseDto[] = [];
      for (const user of usersWithLocations) {
        try {
          const userHistory = await this.getUserLocationHistory(user.id, {
            activeOnly,
            sortOrder,
          });
          results.push(userHistory);
        } catch (error) {
          // Continuar con el siguiente usuario si hay error
          this.logger.warn(
            `Error obteniendo historial para usuario ${user.id}:`,
            error,
          );
        }
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Error al obtener historial de ubicaciones de todos los usuarios: ${error.message}`,
        error.stack,
      );
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

      // Optimized: Single query with all necessary data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userLocations: {
            where: { isActive: true },
            select: { locationName: true },
          },
          consultaLogs: {
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            select: {
              consultaType: true,
              resultado: true,
              duracionMs: true,
              totalEncontrado: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const logs = user.consultaLogs;
      const totalConsultas = logs.length;
      const consultasEC = logs.filter((l) => l.consultaType === 'EC').length;
      const consultasICS = logs.filter((l) => l.consultaType === 'ICS').length;
      const consultasExitosas = logs.filter(
        (l) => l.resultado === 'SUCCESS',
      ).length;
      const consultasConError = logs.filter(
        (l) => l.resultado === 'ERROR',
      ).length;
      const consultasNoEncontradas = logs.filter(
        (l) => l.resultado === 'NOT_FOUND',
      ).length;

      const tiemposRespuesta = logs
        .filter((l) => l.duracionMs !== null)
        .map((l) => l.duracionMs!);
      const promedioTiempoRespuesta =
        tiemposRespuesta.length > 0
          ? tiemposRespuesta.reduce((a, b) => a + b, 0) /
            tiemposRespuesta.length
          : 0;

      const totalRecaudadoConsultado = logs
        .filter((l) => l.resultado === 'SUCCESS' && l.totalEncontrado)
        .reduce((sum, l) => sum + (l.totalEncontrado?.toNumber() || 0), 0);

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
        totalRecaudadoConsultado,
        ultimaConsulta: logs[0]?.createdAt,
        periodoConsultado: this.formatDateRange(dateRange),
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener estadísticas de usuario: ${error.message}`,
        error.stack,
      );
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

      // Optimized: Single query with all necessary data
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
          userLocations: {
            where: { isActive: true },
            select: { locationName: true },
          },
          consultaLogs: {
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            select: {
              consultaType: true,
              resultado: true,
              duracionMs: true,
              totalEncontrado: true,
              createdAt: true,
            },
          },
        },
      });

      const usuariosStats: UserStatsResponseDto[] = [];
      let totalConsultas = 0;
      let consultasEC = 0;
      let consultasICS = 0;

      // Process each user's stats efficiently
      for (const usuario of usuarios) {
        const logs = usuario.consultaLogs;
        const totalConsultasUser = logs.length;
        const consultasECUser = logs.filter(
          (l) => l.consultaType === 'EC',
        ).length;
        const consultasICSUser = logs.filter(
          (l) => l.consultaType === 'ICS',
        ).length;
        const consultasExitosas = logs.filter(
          (l) => l.resultado === 'SUCCESS',
        ).length;
        const consultasConError = logs.filter(
          (l) => l.resultado === 'ERROR',
        ).length;
        const consultasNoEncontradas = logs.filter(
          (l) => l.resultado === 'NOT_FOUND',
        ).length;

        const tiemposRespuesta = logs
          .filter((l) => l.duracionMs !== null)
          .map((l) => l.duracionMs!);
        const promedioTiempoRespuesta =
          tiemposRespuesta.length > 0
            ? tiemposRespuesta.reduce((a, b) => a + b, 0) /
              tiemposRespuesta.length
            : 0;

        const totalRecaudado = logs
          .filter((l) => l.resultado === 'SUCCESS' && l.totalEncontrado)
          .reduce((sum, l) => sum + (l.totalEncontrado?.toNumber() || 0), 0);

        const ultimaConsulta =
          logs.length > 0
            ? logs.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )[0].createdAt
            : undefined;

        usuariosStats.push({
          userId: usuario.id,
          username: usuario.username,
          userLocation: usuario.userLocations[0]?.locationName || location,
          totalConsultas: totalConsultasUser,
          consultasEC: consultasECUser,
          consultasICS: consultasICSUser,
          consultasExitosas,
          consultasConError,
          consultasNoEncontradas,
          promedioTiempoRespuesta,
          totalRecaudadoConsultado: totalRecaudado,
          ultimaConsulta,
          periodoConsultado: this.formatDateRange(dateRange),
        });

        totalConsultas += totalConsultasUser;
        consultasEC += consultasECUser;
        consultasICS += consultasICSUser;
      }

      return {
        location,
        totalUsuarios: usuarios.length,
        totalConsultas,
        consultasEC,
        consultasICS,
        promedioConsultasPorUsuario:
          usuarios.length > 0 ? totalConsultas / usuarios.length : 0,
        usuariosStats,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener estadísticas por ubicación: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Obtener estadísticas generales
  async getGeneralStats(
    filters: GetUserStatsDto,
  ): Promise<GeneralStatsResponseDto> {
    try {
      const dateRange = this.getDateRange(filters);

      // Optimized: Single query to get all necessary data
      const [totalUsuarios, consultaStats, locationStats, topUsersData] =
        await Promise.all([
          // Total users count
          this.prisma.user.count({
            where: { role: 'USER' },
          }),

          // Aggregated consultation stats
          this.prisma.consultaLog.groupBy({
            by: ['consultaType', 'resultado'],
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            _count: {
              id: true,
            },
          }),

          // Location stats with user data in single query
          this.prisma.userLocation.findMany({
            where: { isActive: true },
            select: {
              locationName: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  consultaLogs: {
                    where: {
                      createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end,
                      },
                    },
                    select: {
                      consultaType: true,
                      resultado: true,
                      duracionMs: true,
                      totalEncontrado: true,
                      createdAt: true,
                    },
                  },
                },
              },
            },
          }),

          // Top users data
          this.prisma.consultaLog.groupBy({
            by: ['userId'],
            where: {
              createdAt: {
                gte: dateRange.start,
                lte: dateRange.end,
              },
            },
            _count: {
              id: true,
            },
            orderBy: {
              _count: {
                id: 'desc',
              },
            },
            take: 10,
          }),
        ]);

      // Process consultation stats
      let totalConsultas = 0;
      let usuariosActivosSet = new Set<string>();
      const consultasPorTipo = { EC: 0, ICS: 0 };
      const consultasPorResultado = { SUCCESS: 0, ERROR: 0, NOT_FOUND: 0 };

      consultaStats.forEach((stat) => {
        totalConsultas += stat._count.id;
        consultasPorTipo[stat.consultaType as 'EC' | 'ICS'] += stat._count.id;
        consultasPorResultado[
          stat.resultado as 'SUCCESS' | 'ERROR' | 'NOT_FOUND'
        ] += stat._count.id;
      });

      // Process location stats efficiently
      const locationMap = new Map<
        string,
        {
          users: Array<{
            id: string;
            username: string;
            logs: any[];
          }>;
        }
      >();

      locationStats.forEach((loc) => {
        if (!locationMap.has(loc.locationName)) {
          locationMap.set(loc.locationName, { users: [] });
        }
        locationMap.get(loc.locationName)!.users.push({
          id: loc.user.id,
          username: loc.user.username,
          logs: loc.user.consultaLogs,
        });

        // Count active users
        if (loc.user.consultaLogs.length > 0) {
          usuariosActivosSet.add(loc.user.id);
        }
      });

      // Build location stats
      const estatsPorUbicacion: LocationStatsResponseDto[] = [];
      for (const [locationName, data] of locationMap) {
        const usuariosStats: UserStatsResponseDto[] = [];
        let locationTotalConsultas = 0;
        let locationConsultasEC = 0;
        let locationConsultasICS = 0;

        for (const user of data.users) {
          const logs = user.logs;
          const totalConsultasUser = logs.length;
          const consultasEC = logs.filter(
            (l) => l.consultaType === 'EC',
          ).length;
          const consultasICS = logs.filter(
            (l) => l.consultaType === 'ICS',
          ).length;
          const consultasExitosas = logs.filter(
            (l) => l.resultado === 'SUCCESS',
          ).length;
          const consultasConError = logs.filter(
            (l) => l.resultado === 'ERROR',
          ).length;
          const consultasNoEncontradas = logs.filter(
            (l) => l.resultado === 'NOT_FOUND',
          ).length;

          const tiemposRespuesta = logs
            .filter((l) => l.duracionMs !== null)
            .map((l) => l.duracionMs!);
          const promedioTiempoRespuesta =
            tiemposRespuesta.length > 0
              ? tiemposRespuesta.reduce((a, b) => a + b, 0) /
                tiemposRespuesta.length
              : 0;

          const totalRecaudado = logs
            .filter((l) => l.resultado === 'SUCCESS' && l.totalEncontrado)
            .reduce((sum, l) => sum + (l.totalEncontrado?.toNumber() || 0), 0);

          const ultimaConsulta =
            logs.length > 0
              ? logs.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime(),
                )[0].createdAt
              : undefined;

          usuariosStats.push({
            userId: user.id,
            username: user.username,
            userLocation: locationName,
            totalConsultas: totalConsultasUser,
            consultasEC,
            consultasICS,
            consultasExitosas,
            consultasConError,
            consultasNoEncontradas,
            promedioTiempoRespuesta,
            totalRecaudadoConsultado: totalRecaudado,
            ultimaConsulta,
            periodoConsultado: this.formatDateRange(dateRange),
          });

          locationTotalConsultas += totalConsultasUser;
          locationConsultasEC += consultasEC;
          locationConsultasICS += consultasICS;
        }

        estatsPorUbicacion.push({
          location: locationName,
          totalUsuarios: data.users.length,
          totalConsultas: locationTotalConsultas,
          consultasEC: locationConsultasEC,
          consultasICS: locationConsultasICS,
          promedioConsultasPorUsuario:
            data.users.length > 0
              ? locationTotalConsultas / data.users.length
              : 0,
          usuariosStats,
        });
      }

      // Get top users details efficiently
      const topUsuarios: UserStatsResponseDto[] = [];
      if (topUsersData.length > 0) {
        const topUserIds = topUsersData.map((u) => u.userId);
        const topUsersDetails = await this.prisma.user.findMany({
          where: {
            id: { in: topUserIds },
          },
          include: {
            userLocations: {
              where: { isActive: true },
              select: { locationName: true },
            },
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

        // Process top users in the same order
        for (const topUserData of topUsersData) {
          const user = topUsersDetails.find((u) => u.id === topUserData.userId);
          if (user) {
            const logs = user.consultaLogs;
            const totalConsultasUser = logs.length;
            const consultasEC = logs.filter(
              (l) => l.consultaType === 'EC',
            ).length;
            const consultasICS = logs.filter(
              (l) => l.consultaType === 'ICS',
            ).length;
            const consultasExitosas = logs.filter(
              (l) => l.resultado === 'SUCCESS',
            ).length;
            const consultasConError = logs.filter(
              (l) => l.resultado === 'ERROR',
            ).length;
            const consultasNoEncontradas = logs.filter(
              (l) => l.resultado === 'NOT_FOUND',
            ).length;

            const tiemposRespuesta = logs
              .filter((l) => l.duracionMs !== null)
              .map((l) => l.duracionMs!);
            const promedioTiempoRespuesta =
              tiemposRespuesta.length > 0
                ? tiemposRespuesta.reduce((a, b) => a + b, 0) /
                  tiemposRespuesta.length
                : 0;

            const totalRecaudado = logs
              .filter((l) => l.resultado === 'SUCCESS' && l.totalEncontrado)
              .reduce(
                (sum, l) => sum + (l.totalEncontrado?.toNumber() || 0),
                0,
              );

            const ultimaConsulta =
              logs.length > 0
                ? logs.sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )[0].createdAt
                : undefined;

            topUsuarios.push({
              userId: user.id,
              username: user.username,
              userLocation: user.userLocations[0]?.locationName,
              totalConsultas: totalConsultasUser,
              consultasEC,
              consultasICS,
              consultasExitosas,
              consultasConError,
              consultasNoEncontradas,
              promedioTiempoRespuesta,
              totalRecaudadoConsultado: totalRecaudado,
              ultimaConsulta,
              periodoConsultado: this.formatDateRange(dateRange),
            });
          }
        }
      }

      return {
        totalUsuarios,
        usuariosActivos: usuariosActivosSet.size,
        totalConsultas,
        consultasPorTipo,
        consultasPorResultado,
        estatsPorUbicacion,
        topUsuarios,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener estadísticas generales: ${error.message}`,
        error.stack,
      );
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

      const logsResponse: ConsultaLogResponseDto[] = logs.map((log) => ({
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
      this.logger.error(
        `Error al obtener logs de consultas: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getDateRange(filters: GetUserStatsDto) {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (
      filters.timeRange === StatsTimeRange.CUSTOM &&
      filters.startDate &&
      filters.endDate
    ) {
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

  // Obtener todas las ubicaciones disponibles con usuarios asignados
  async getAllLocations(): Promise<any[]> {
    try {
      // Obtener todas las ubicaciones únicas con usuarios asignados
      const locationNames = await this.prisma.userLocation.findMany({
        where: { isActive: true },
        select: { locationName: true },
        distinct: ['locationName'],
        orderBy: { locationName: 'asc' },
      });

      // Para cada ubicación, obtener los usuarios asignados
      const locationsWithUsers = await Promise.all(
        locationNames.map(async (location) => {
          const userLocations = await this.prisma.userLocation.findMany({
            where: {
              locationName: location.locationName,
              isActive: true,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  nombre: true,
                  apellido: true,
                  correo: true,
                  role: true,
                  isActive: true,
                  lastLogin: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'desc',
            },
          });

          // Obtener información general de la ubicación
          const locationInfo = userLocations[0] || null;

          return {
            locationName: location.locationName,
            locationCode: locationInfo?.locationCode || null,
            description: locationInfo?.description || null,
            isActive: true,
            usersCount: userLocations.length,
            users: userLocations.map((ul) => ({
              id: ul.user.id,
              username: ul.user.username,
              nombre: ul.user.nombre,
              apellido: ul.user.apellido,
              correo: ul.user.correo,
              role: ul.user.role,
              isActive: ul.user.isActive,
              lastLogin: ul.user.lastLogin,
              assignedAt: ul.assignedAt,
              assignedBy: ul.assignedBy,
            })),
            createdAt: locationInfo?.createdAt,
            updatedAt: locationInfo?.updatedAt,
          };
        }),
      );

      // También obtener ubicaciones inactivas si existen
      const inactiveLocationNames = await this.prisma.userLocation.findMany({
        where: { isActive: false },
        select: { locationName: true },
        distinct: ['locationName'],
        orderBy: { locationName: 'asc' },
      });

      const inactiveLocationsWithUsers = await Promise.all(
        inactiveLocationNames.map(async (location) => {
          const userLocations = await this.prisma.userLocation.findMany({
            where: {
              locationName: location.locationName,
              isActive: false,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  nombre: true,
                  apellido: true,
                  correo: true,
                  role: true,
                  isActive: true,
                },
              },
            },
            orderBy: {
              assignedAt: 'desc',
            },
          });

          const locationInfo = userLocations[0] || null;

          return {
            locationName: location.locationName,
            locationCode: locationInfo?.locationCode || null,
            description: locationInfo?.description || null,
            isActive: false,
            usersCount: userLocations.length,
            users: userLocations.map((ul) => ({
              id: ul.user.id,
              username: ul.user.username,
              nombre: ul.user.nombre,
              apellido: ul.user.apellido,
              correo: ul.user.correo,
              role: ul.user.role,
              isActive: ul.user.isActive,
              assignedAt: ul.assignedAt,
              assignedBy: ul.assignedBy,
            })),
            createdAt: locationInfo?.createdAt,
            updatedAt: locationInfo?.updatedAt,
          };
        }),
      );

      // Combinar ubicaciones activas e inactivas
      const allLocations = [
        ...locationsWithUsers,
        ...inactiveLocationsWithUsers,
      ];

      // Ordenar por estado (activas primero) y luego por nombre
      return allLocations.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.locationName.localeCompare(b.locationName);
      });
    } catch (error) {
      this.logger.error(
        `Error al obtener ubicaciones: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
