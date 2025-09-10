import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReadonlyDatabaseService } from '../../consulta-ec/readonly-database.service';
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
  ConsultationStatsDto,
  TypeConsultaHistoryDto,
} from './dto/user-location.dto';
import {
  GetUserStatsDto,
  UserStatsResponseDto,
  LocationStatsResponseDto,
  GeneralStatsResponseDto,
  StatsTimeRange,
  GetMatchDto,
  MatchResponseDto,
  MatchResultDto,
  ConsultaLogMatchDto,
  RecaudoMatchDto,
  ArticuloDuplicadoDto,
  EstadisticasDuplicadosDto,
} from './dto/user-stats.dto';

@Injectable()
export class UserStatsService {
  private readonly logger = new Logger(UserStatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly readonlyDb: ReadonlyDatabaseService,
  ) {}

  // Registrar log de consulta
  async logConsulta(
    data: CreateConsultaLogDto & { consultaKey?: string },
  ): Promise<ConsultaLogResponseDto> {
    try {
      // Obtener la ubicación activa del usuario para userLocationId
      let userLocationId: string | undefined;
      if (data.userId) {
        const activeLocation = await this.prisma.userLocation.findFirst({
          where: {
            userId: data.userId,
            isActive: true,
          },
          select: { id: true },
        });
        userLocationId = activeLocation?.id;
      }

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
          consultaKey: data.consultaKey,
          userLocationId: userLocationId,
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
        // Eliminar ubicación anterior si existe (en lugar de desactivar)
        if (currentLocation) {
          await prisma.userLocation.delete({
            where: {
              id: currentLocation.id,
            },
          });

          this.logger.log(
            `Ubicación anterior eliminada para usuario ${user.username} (${data.userId}): ${currentLocation.locationName} -> ${data.locationName}`,
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
        includeConsultationStats = false,
        statsDateFrom,
        statsDateTo,
      } = options || {};
      const skip = (page - 1) * limit;

      // Construir filtros
      const whereClause: any = { userId };
      if (activeOnly) {
        whereClause.isActive = true;
      }

      // Obtener ubicaciones del usuario con información del usuario asignador
      const userLocations = await this.prisma.userLocation.findMany({
        where: whereClause,
        orderBy: {
          assignedAt: sortOrder,
        },
        skip,
        take: limit,
        include: {
          assignedByUser: {
            select: {
              id: true,
              username: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      });

      // Obtener información adicional para calcular duraciones
      const allUserLocations = await this.prisma.userLocation.findMany({
        where: { userId },
        orderBy: { assignedAt: 'asc' },
      });

      // Procesar ubicaciones para calcular duraciones y estadísticas
      const dateFrom = statsDateFrom ? new Date(statsDateFrom) : undefined;
      const dateTo = statsDateTo ? new Date(statsDateTo) : undefined;

      const locationHistory: UserLocationHistoryItemDto[] = await Promise.all(
        userLocations.map(async (location) => {
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

          // Obtener estadísticas por ubicación si está habilitado
          let consultationStats: ConsultationStatsDto | undefined;
          let typeConsultaHistory: TypeConsultaHistoryDto[] | undefined;

          if (includeConsultationStats) {
            try {
              consultationStats = await this.getUserLocationConsultationStats(
                userId,
                location.locationName,
                dateFrom,
                dateTo,
              );

              // Obtener historial detallado de consultas
              typeConsultaHistory = await this.getLocationConsultationHistory(
                userId,
                location.id,
                dateFrom,
                dateTo,
              );
            } catch (error) {
              this.logger.warn(
                `Error al obtener estadísticas para ubicación ${location.locationName}: ${error.message}`,
              );
            }
          }

          // Construir el nombre completo del usuario asignador
          let assignedByUsername: string | undefined;
          if (location.assignedByUser) {
            const { nombre, apellido, username } = location.assignedByUser;
            if (nombre && apellido) {
              assignedByUsername = `${nombre} ${apellido} (${username})`;
            } else {
              assignedByUsername = username;
            }
          }

          return {
            id: location.id,
            locationName: location.locationName,
            locationCode: location.locationCode ?? undefined,
            description: location.description ?? undefined,
            isActive: location.isActive,
            assignedAt: location.assignedAt,
            assignedBy: location.assignedBy ?? undefined,
            assignedByUsername,
            createdAt: location.createdAt,
            updatedAt: location.updatedAt,
            durationDays,
            deactivatedAt,
            consultationStats,
            typeConsultaHistory,
          };
        }),
      );

      // Obtener ubicación actual
      const currentLocation = locationHistory.find((loc) => loc.isActive);

      // Calcular estadísticas
      const totalLocations = await this.prisma.userLocation.count({
        where: { userId },
      });

      const firstLocation = allUserLocations[0];
      const lastLocation = allUserLocations[allUserLocations.length - 1];

      // Preparar respuesta base
      const response: UserLocationHistoryResponseDto = {
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

      // Obtener estadísticas de consultas si está habilitado
      if (includeConsultationStats) {
        const dateFrom = statsDateFrom ? new Date(statsDateFrom) : undefined;
        const dateTo = statsDateTo ? new Date(statsDateTo) : undefined;

        response.consultationStats = await this.getUserConsultationStats(
          userId,
          dateFrom,
          dateTo,
        );
      }

      return response;
    } catch (error) {
      this.logger.error(
        `Error al obtener historial de ubicaciones: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // Método privado para formatear valor como moneda
  private formatCurrency(value: number): string {
    if (!value || value === 0) return 'L.0.00';

    // Convertir a número si es string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    // Formatear con separadores de miles y decimales
    return `L.${numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatDateToLocalTime(date: Date): Date {
    // Honduras está en UTC-6 (CST)
    // Ajustar la fecha restando 6 horas para convertir de UTC a hora local de Honduras
    const hondurasTime = new Date(date.getTime() - 6 * 60 * 60 * 1000);
    return hondurasTime;
  }

  // Método privado para obtener historial detallado de consultas por ubicación
  private async getLocationConsultationHistory(
    userId: string,
    userLocationId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<TypeConsultaHistoryDto[]> {
    try {
      const whereClause: any = {
        userId,
        userLocationId,
      };

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      const consultaLogs = await this.prisma.consultaLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        select: {
          consultaType: true,
          consultaSubtype: true,
          consultaKey: true,
          totalEncontrado: true,
          createdAt: true,
        },
      });

      // Agrupar por tipo, método y clave de consulta
      const groupedConsultas = consultaLogs.reduce((acc, log) => {
        const key = `${log.consultaType}_${log.consultaSubtype}_${log.consultaKey || 'unknown'}`;

        if (!acc[key]) {
          acc[key] = {
            type: log.consultaType,
            method: log.consultaSubtype,
            consultaKey: log.consultaKey,
            consultations: [],
          };
        }

        acc[key].consultations.push({
          key: log.consultaKey,
          total: log.totalEncontrado || 0,
          consultedAt: log.createdAt,
        });

        return acc;
      }, {});

      // Convertir a array con el formato TypeConsultaHistoryDto
      return Object.values(groupedConsultas).map((group: any) => {
        const totalSum = group.consultations.reduce(
          (sum: number, c: any) => sum + c.total,
          0,
        );
        return {
          type: group.type,
          method: group.method,
          key: group.consultaKey,
          total: this.formatCurrency(totalSum),
          consultedAt:
            group.consultations.length > 0
              ? this.formatDateToLocalTime(group.consultations[0].consultedAt)
              : this.formatDateToLocalTime(new Date()),
        };
      });
    } catch (error) {
      this.logger.error(
        `Error al obtener historial de consultas por ubicación: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  // Método privado para obtener estadísticas de consultas por usuario (optimizado)
  private async getUserConsultationStats(
    userId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ConsultationStatsDto> {
    try {
      const whereClause: any = { userId };

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      // Usar una sola consulta SQL optimizada con agregaciones
      const result = await this.prisma.consultaLog.aggregate({
        where: whereClause,
        _count: {
          id: true,
        },
        _sum: {
          duracionMs: true,
          totalEncontrado: true,
        },
      });

      // Obtener conteos específicos usando consultas paralelas optimizadas
      const [
        icsNormalCount,
        icsAmnistiaCount,
        ecNormalCount,
        ecAmnistiaCount,
        successCount,
        errorCount,
      ] = await Promise.all([
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'ICS',
            consultaSubtype: 'normal',
          },
        }),
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'ICS',
            consultaSubtype: 'amnistia',
          },
        }),
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'EC',
            consultaSubtype: 'normal',
          },
        }),
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'EC',
            consultaSubtype: 'amnistia',
          },
        }),
        this.prisma.consultaLog.count({
          where: { ...whereClause, resultado: 'SUCCESS' },
        }),
        this.prisma.consultaLog.count({
          where: { ...whereClause, resultado: { in: ['ERROR', 'NOT_FOUND'] } },
        }),
      ]);

      const totalConsultas = result._count.id || 0;
      const totalDuracion = result._sum.duracionMs || 0;
      const totalAcumulado = Number(result._sum.totalEncontrado || 0);
      const promedioDuracionMs =
        totalConsultas > 0
          ? Math.round(totalDuracion / totalConsultas)
          : undefined;

      return {
        icsNormal: icsNormalCount,
        icsAmnistia: icsAmnistiaCount,
        ecNormal: ecNormalCount,
        ecAmnistia: ecAmnistiaCount,
        totalExitosas: successCount,
        totalErrores: errorCount,
        totalConsultas,
        promedioDuracionMs,
        totalAcumulado: totalAcumulado > 0 ? totalAcumulado : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener estadísticas de consultas para usuario ${userId}: ${error.message}`,
        error.stack,
      );
      // Retornar estadísticas vacías en caso de error
      return {
        icsNormal: 0,
        icsAmnistia: 0,
        ecNormal: 0,
        ecAmnistia: 0,
        totalExitosas: 0,
        totalErrores: 0,
        totalConsultas: 0,
      };
    }
  }

  private async getUserLocationConsultationStats(
    userId: string,
    locationName: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<ConsultationStatsDto> {
    try {
      // Obtener el período de tiempo que el usuario estuvo en esta ubicación específica
      const userLocation = await this.prisma.userLocation.findFirst({
        where: {
          userId,
          locationName,
        },
        orderBy: {
          assignedAt: 'desc',
        },
      });

      if (!userLocation) {
        // Si no se encuentra la ubicación, retornar estadísticas vacías
        return {
          icsNormal: 0,
          icsAmnistia: 0,
          ecNormal: 0,
          ecAmnistia: 0,
          totalExitosas: 0,
          totalErrores: 0,
          totalConsultas: 0,
        };
      }

      // Determinar el rango de fechas para esta ubicación específica
      const locationStartDate = userLocation.assignedAt;
      let locationEndDate: Date | undefined;

      if (!userLocation.isActive) {
        // Si la ubicación no está activa, buscar cuándo se desactivó
        const nextLocation = await this.prisma.userLocation.findFirst({
          where: {
            userId,
            assignedAt: {
              gt: userLocation.assignedAt,
            },
          },
          orderBy: {
            assignedAt: 'asc',
          },
        });
        locationEndDate = nextLocation?.assignedAt;
      }

      // Construir el whereClause basado en el período de la ubicación
      const whereClause: any = {
        userId,
        createdAt: {
          gte: locationStartDate,
        },
      };

      // Aplicar fecha de fin si la ubicación no está activa
      if (locationEndDate) {
        whereClause.createdAt.lt = locationEndDate;
      }

      // Aplicar filtros de fecha adicionales si se proporcionan
      if (dateFrom && dateFrom > locationStartDate) {
        whereClause.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        if (locationEndDate) {
          whereClause.createdAt.lte =
            dateTo < locationEndDate ? dateTo : locationEndDate;
        } else {
          whereClause.createdAt.lte = dateTo;
        }
      }

      // Usar una sola consulta SQL optimizada con agregaciones
      const result = await this.prisma.consultaLog.aggregate({
        where: whereClause,
        _count: {
          id: true,
        },
        _sum: {
          duracionMs: true,
          totalEncontrado: true,
        },
      });

      // Obtener conteos específicos usando consultas paralelas optimizadas
      const [
        icsNormalCount,
        icsAmnistiaCount,
        ecNormalCount,
        ecAmnistiaCount,
        successCount,
        errorCount,
      ] = await Promise.all([
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'ICS',
            consultaSubtype: 'normal',
          },
        }),
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'ICS',
            consultaSubtype: 'amnistia',
          },
        }),
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'EC',
            consultaSubtype: 'normal',
          },
        }),
        this.prisma.consultaLog.count({
          where: {
            ...whereClause,
            consultaType: 'EC',
            consultaSubtype: 'amnistia',
          },
        }),
        this.prisma.consultaLog.count({
          where: { ...whereClause, resultado: 'SUCCESS' },
        }),
        this.prisma.consultaLog.count({
          where: { ...whereClause, resultado: { in: ['ERROR', 'NOT_FOUND'] } },
        }),
      ]);

      const totalConsultas = result._count.id || 0;
      const totalDuracion = result._sum.duracionMs || 0;
      const totalAcumulado = Number(result._sum.totalEncontrado || 0);
      const promedioDuracionMs =
        totalConsultas > 0
          ? Math.round(totalDuracion / totalConsultas)
          : undefined;

      return {
        icsNormal: icsNormalCount,
        icsAmnistia: icsAmnistiaCount,
        ecNormal: ecNormalCount,
        ecAmnistia: ecAmnistiaCount,
        totalExitosas: successCount,
        totalErrores: errorCount,
        totalConsultas,
        promedioDuracionMs,
        totalAcumulado: totalAcumulado > 0 ? totalAcumulado : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener estadísticas de consultas para usuario ${userId} en ubicación ${locationName}: ${error.message}`,
        error.stack,
      );
      // Retornar estadísticas vacías en caso de error
      return {
        icsNormal: 0,
        icsAmnistia: 0,
        ecNormal: 0,
        ecAmnistia: 0,
        totalExitosas: 0,
        totalErrores: 0,
        totalConsultas: 0,
      };
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
        includeConsultationStats = true,
        statsDateFrom,
        statsDateTo,
      } = options || {};
      const skip = (page - 1) * limit;

      // Convertir fechas de string a Date si están presentes
      const dateFrom = statsDateFrom ? new Date(statsDateFrom) : undefined;
      const dateTo = statsDateTo ? new Date(statsDateTo) : undefined;

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

      // Obtener historial para cada usuario con estadísticas de consultas en paralelo
      const results: UserLocationHistoryResponseDto[] = [];

      // Usar Promise.allSettled para procesar usuarios en paralelo y manejar errores individualmente
      const userPromises = usersWithLocations.map(async (user) => {
        try {
          // Obtener historial de ubicaciones con estadísticas incluidas
          const userHistory = await this.getUserLocationHistory(user.id, {
            activeOnly,
            sortOrder,
            includeConsultationStats,
            statsDateFrom,
            statsDateTo,
          });

          return userHistory;
        } catch (error) {
          this.logger.warn(
            `Error obteniendo datos para usuario ${user.id}:`,
            error,
          );
          return null;
        }
      });

      const settledResults = await Promise.allSettled(userPromises);

      // Filtrar resultados exitosos
      for (const result of settledResults) {
        if (result.status === 'fulfilled' && result.value !== null) {
          results.push(result.value);
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
      const limit = parseInt(filters.limit as any) || 50;
      const offset = parseInt(filters.offset as any) || 0;

      const where: any = {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.consultaType && { consultaType: filters.consultaType }),
        ...(filters.consultaSubtype && {
          consultaSubtype: filters.consultaSubtype,
        }),
        ...(filters.resultado && { resultado: filters.resultado }),
      };

      // Filtro por username
      if (filters.username) {
        where.user = {
          username: {
            contains: filters.username,
          },
        };
      }

      // Filtro por userLocation
      if (filters.userLocation) {
        where.user = {
          ...where.user,
          userLocations: {
            some: {
              locationName: {
                contains: filters.userLocation,
              },
              isActive: true,
            },
          },
        };
      }

      // Filtro por parámetros
      if (filters.parametros) {
        where.parametros = {
          contains: filters.parametros,
        };
      }

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

  // Método para obtener matches entre consultas y pagos de RECAUDO
  async getMatches(filters: GetMatchDto): Promise<MatchResponseDto> {
    try {
      this.logger.log('Iniciando proceso de match con RECAUDO');

      // 1. Construir filtros para consultas
      const consultaFilters: any[] = [
        { resultado: ConsultaResultado.SUCCESS },
        { parametros: { not: '' } },
      ];

      // Fecha límite de operación: 19 de agosto 2025
      const fechaLimiteOperacion = new Date('2025-08-19T00:00:00.000Z');

      // Aplicar filtro de fecha de consulta (por defecto desde 19 agosto 2025)
      if (filters.consultaStartDate) {
        consultaFilters.push({
          createdAt: { gte: new Date(filters.consultaStartDate) },
        });
      } else {
        consultaFilters.push({ createdAt: { gte: fechaLimiteOperacion } });
      }

      if (filters.consultaEndDate) {
        consultaFilters.push({
          createdAt: {
            lte: new Date(filters.consultaEndDate + 'T23:59:59.999Z'),
          },
        });
      }

      // Aplicar filtro por tipo de consulta
      if (filters.consultaType) {
        consultaFilters.push({ consultaType: filters.consultaType });
      }

      // Obtener consultas SUCCESS de nuestro sistema
      const consultaLogs = await this.prisma.consultaLog.findMany({
        where: {
          AND: consultaFilters,
        },
        select: {
          parametros: true,
          createdAt: true,
          totalEncontrado: true,
          consultaType: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Encontradas ${consultaLogs.length} consultas SUCCESS`);

      // 2. Construir consulta SQL para RECAUDO
      let whereClause = '';
      const currentYear = new Date().getFullYear();

      if (filters.startDate && filters.endDate) {
        whereClause = `WHERE CONVERT(DATE, [FECHA PAGO]) BETWEEN '${filters.startDate}' AND '${filters.endDate}' AND [PRODUCTO] IN('Impuesto de Bienes Inmuebles','Volumen de Ventas')`;
      } else if (filters.year) {
        // Convertir año a rango de fechas
        whereClause = `WHERE CONVERT(DATE, [FECHA PAGO]) BETWEEN '${filters.year}-01-01' AND '${filters.year}-12-31' AND [PRODUCTO] IN('Impuesto de Bienes Inmuebles','Volumen de Ventas')`;
      } else {
        // Por defecto, usar el año actual como rango de fechas
        whereClause = `WHERE CONVERT(DATE, [FECHA PAGO]) BETWEEN '${currentYear}-01-01' AND '${currentYear}-12-31' AND [PRODUCTO] IN('Impuesto de Bienes Inmuebles','Volumen de Ventas')`;
      }

      const recaudoQuery = `
        USE [RECAUDO]
        SELECT [ARTICULO]
              ,[IDENTIDAD]
              ,[FECHA PAGO] as FECHA_PAGO
              ,[TOTAL PAGADO] as TOTAL_PAGADO
      FROM [RECAUDO].[dbo].[TBL_RECAUDO_AMDC]
        ${whereClause}
        GROUP BY ID_PAGO, [ARTICULO], [IDENTIDAD], [FECHA PAGO], [TOTAL PAGADO]
        ORDER BY [FECHA PAGO] DESC
      `;

      this.logger.log('Ejecutando consulta en base RECAUDO...');

      // 3. Ejecutar consulta en RECAUDO
      const recaudoData = await this.readonlyDb.executeQuery(recaudoQuery);

      this.logger.log(`Encontrados ${recaudoData.length} registros en RECAUDO`);

      // 4. Crear mapa de artículos de RECAUDO para búsqueda rápida (múltiples pagos por artículo)
      const recaudoMap = new Map<string, any[]>();
      recaudoData.forEach((item) => {
        const articulo = item.ARTICULO;
        if (!recaudoMap.has(articulo)) {
          recaudoMap.set(articulo, []);
        }
        recaudoMap.get(articulo)!.push(item);
      });

      // 5. Buscar matches y clasificar pagos (nueva lógica corregida)
      const matches: MatchResultDto[] = [];
      const matchesUnicos = new Map<string, MatchResultDto>(); // Para deduplicación por artículo
      let sumaTotalEncontrado = 0;

      // Mapas para estadísticas de duplicados
      const articulosConsultados = new Map<string, number>(); // articulo -> veces consultado
      const articulosConPagos = new Map<string, any[]>(); // articulo -> array de pagos
      const consultasPorArticulo = new Map<string, any[]>(); // articulo -> array de consultas

      // Procesar todas las consultas para detectar duplicados
      for (const consulta of consultaLogs) {
        const totalEncontradoNum = consulta.totalEncontrado
          ? consulta.totalEncontrado.toNumber()
          : 0;
        sumaTotalEncontrado += totalEncontradoNum;

        // Extraer el valor del JSON según el tipo de consulta
        let valorBusqueda = '';
        try {
          const parametrosJson = JSON.parse(consulta.parametros);

          // Determinar qué campo usar para buscar en RECAUDO (solo claveCatastral e ICS)
          if (parametrosJson.claveCatastral) {
            valorBusqueda = parametrosJson.claveCatastral;
          } else if (parametrosJson.ics) {
            valorBusqueda = parametrosJson.ics;
          }
          // Eliminado soporte para DNI
        } catch (error) {
          this.logger.warn(
            `Error parsing parametros JSON: ${consulta.parametros}`,
          );
          continue;
        }

        if (!valorBusqueda) {
          continue;
        }

        // Contar consultas por artículo
        articulosConsultados.set(valorBusqueda, (articulosConsultados.get(valorBusqueda) || 0) + 1);
        
        // Guardar consulta por artículo
        if (!consultasPorArticulo.has(valorBusqueda)) {
          consultasPorArticulo.set(valorBusqueda, []);
        }
        consultasPorArticulo.get(valorBusqueda)!.push(consulta);

        // Buscar matches en RECAUDO usando el valor extraído
        const recaudoMatches = recaudoMap.get(valorBusqueda);

        if (recaudoMatches && recaudoMatches.length > 0) {
          // Guardar pagos por artículo
          articulosConPagos.set(valorBusqueda, recaudoMatches);

          // Procesar todos los pagos para este artículo
          for (const recaudoMatch of recaudoMatches) {
            const fechaConsulta = new Date(consulta.createdAt);
            const fechaPago = new Date(recaudoMatch.FECHA_PAGO);
            const totalPagado = parseFloat(recaudoMatch.TOTAL_PAGADO) || 0;

            // Determinar si es pago mediante app o pago previo
            const esPagoMedianteApp = !(totalEncontradoNum === 0 && fechaPago <= fechaConsulta);
            const tipoPago = esPagoMedianteApp ? 'pago_mediante_app' : 'pago_previo_consulta';

            const nuevoMatch: MatchResultDto = {
              parametro: consulta.parametros,
              consultaLog: {
                parametros: consulta.parametros,
                createdAt: consulta.createdAt,
                totalEncontrado: totalEncontradoNum,
              },
              recaudoData: {
                ARTICULO: recaudoMatch.ARTICULO,
                IDENTIDAD: recaudoMatch.IDENTIDAD,
                FECHA_PAGO: fechaPago,
                TOTAL_PAGADO: totalPagado,
                ANIO_PAGADO: fechaPago.getFullYear(),
              },
              tipoPago,
              esPagoMedianteApp,
            };

            // Lógica de deduplicación: mantener solo el match más reciente por artículo
            const articuloKey = recaudoMatch.ARTICULO;
            const matchExistente = matchesUnicos.get(articuloKey);
            
            if (!matchExistente || new Date(consulta.createdAt) > new Date(matchExistente.consultaLog.createdAt)) {
              matchesUnicos.set(articuloKey, nuevoMatch);
            }
          }

          this.logger.log(
            `Match encontrado - Parámetro: ${valorBusqueda}, ${recaudoMatches.length} pagos encontrados`,
          );
        }
      }

      // Calcular estadísticas SOLO de los matches únicos finales
      let sumaTotalPagado = 0;
      let totalPagosMedianteApp = 0;
      let totalPagosPrevios = 0;
      let sumaTotalPagadoMedianteApp = 0;
      let sumaTotalPagosPrevios = 0;

      for (const match of matchesUnicos.values()) {
        const totalPagado = match.recaudoData.TOTAL_PAGADO;
        sumaTotalPagado += totalPagado;
        
        if (match.esPagoMedianteApp) {
          totalPagosMedianteApp++;
          sumaTotalPagadoMedianteApp += totalPagado;
        } else {
          totalPagosPrevios++;
          sumaTotalPagosPrevios += totalPagado;
        }
      }

      // 6. Generar estadísticas de duplicados (SOLO para artículos que hicieron match)
      const detalleArticulosDuplicados: ArticuloDuplicadoDto[] = [];
      let totalArticulosDuplicados = 0;
      let totalArticulosConMultiplesPagos = 0;
      let totalArticulosUnicosConMatch = 0;

      // Solo procesar artículos que tienen pagos (hicieron match en TBL_RECAUDO_AMDC)
      for (const [articulo, pagosEncontrados] of articulosConPagos.entries()) {
        const vecesConsultado = articulosConsultados.get(articulo) || 0;
        const numerosPagosEncontrados = pagosEncontrados.length;
        const totalPagadoAcumulado = pagosEncontrados.reduce((sum, pago) => sum + (parseFloat(pago.TOTAL_PAGADO) || 0), 0);

        // Contar todos los artículos que hicieron match
        totalArticulosUnicosConMatch++;

        // Solo incluir en detalle si se consultaron más de una vez O tienen múltiples pagos
        if (vecesConsultado > 1 || numerosPagosEncontrados > 1) {
          detalleArticulosDuplicados.push({
            articulo,
            vecesConsultado,
            numerosPagosEncontrados,
            totalPagadoAcumulado,
          });

          if (vecesConsultado > 1) {
            totalArticulosDuplicados++;
          }
          if (numerosPagosEncontrados > 1) {
            totalArticulosConMultiplesPagos++;
          }
        }
      }

      // Calcular artículos únicos reales (total con match - duplicados)
      const totalArticulosUnicosReales = totalArticulosUnicosConMatch - totalArticulosDuplicados;

      const estadisticasDuplicados: EstadisticasDuplicadosDto = {
        totalArticulosUnicos: totalArticulosUnicosReales,
        totalArticulosDuplicados,
        totalArticulosConMultiplesPagos,
        detalleArticulosDuplicados: detalleArticulosDuplicados.sort((a, b) => b.vecesConsultado - a.vecesConsultado),
      };

      // 6. Determinar período consultado
      let periodoConsultado = '';

      // Período de pagos en RECAUDO
      let periodoPagos = '';
      if (filters.startDate && filters.endDate) {
        periodoPagos = `Pagos: ${filters.startDate} a ${filters.endDate}`;
      } else if (filters.year) {
        periodoPagos = `Pagos: Año ${filters.year}`;
      } else {
        periodoPagos = `Pagos: Año ${currentYear}`;
      }

      // Período de consultas
      let periodoConsultas = '';
      if (filters.consultaStartDate && filters.consultaEndDate) {
        periodoConsultas = `Consultas: ${filters.consultaStartDate} a ${filters.consultaEndDate}`;
      } else if (filters.consultaStartDate) {
        periodoConsultas = `Consultas: desde ${filters.consultaStartDate}`;
      } else {
        periodoConsultas = 'Consultas: desde 19 agosto 2025';
      }

      // Tipo de consulta
      const tipoConsulta = filters.consultaType
        ? ` (Tipo: ${filters.consultaType})`
        : ' (Todos los tipos)';

      periodoConsultado = `${periodoPagos} | ${periodoConsultas}${tipoConsulta}`;

      // Convertir matches únicos de Map a Array
      const matchesDeduplicados = Array.from(matchesUnicos.values());

      const resultado: MatchResponseDto = {
        totalConsultasAnalizadas: consultaLogs.length,
        totalMatches: matchesDeduplicados.length,
        totalPagosMedianteApp,
        totalPagosPrevios,
        sumaTotalEncontrado,
        sumaTotalPagado,
        sumaTotalPagadoMedianteApp,
        sumaTotalPagosPrevios,
        periodoConsultado,
        matches: matchesDeduplicados,
        estadisticasDuplicados,
      };

      this.logger.log(
        `Match completado: ${matchesDeduplicados.length} matches únicos de ${consultaLogs.length} consultas (eliminados duplicados). Pagos mediante app: ${totalPagosMedianteApp}, Pagos previos: ${totalPagosPrevios}`,
      );

      return resultado;
    } catch (error) {
      this.logger.error(`Error en getMatches: ${error.message}`);
      throw error;
    }
  }
}
