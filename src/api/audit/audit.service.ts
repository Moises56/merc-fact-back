import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async create(createAuditDto: CreateAuditDto) {
    const auditLog = await this.prisma.auditLog.create({
      data: createAuditDto,
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });

    return auditLog;
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
    accion?: string,
    tabla?: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const skip = (page - 1) * limit;

    const where: {
      accion?: string;
      tabla?: string;
      userId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (accion) {
      where.accion = accion;
    }

    if (tabla) {
      where.tabla = tabla;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              correo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: auditLogs,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });

    return auditLog;
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              correo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { userId } }),
    ]);

    return {
      data: auditLogs,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findByEntityType(entityType: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { tabla: entityType },
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              correo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where: { tabla: entityType } }),
    ]);

    return {
      data: auditLogs,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditStats() {
    const [totalLogs, logsToday, logsByAction, logsByTable, mostActiveUsers] =
      await Promise.all([
        this.prisma.auditLog.count(),
        this.prisma.auditLog.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        this.prisma.auditLog.groupBy({
          by: ['accion'],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        }),
        this.prisma.auditLog.groupBy({
          by: ['tabla'],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
        }),
        this.prisma.auditLog.groupBy({
          by: ['userId'],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 5,
        }),
      ]);

    // Obtener información de los usuarios más activos
    const userIds = mostActiveUsers.map((log) => log.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
      },
    });

    const mostActiveUsersWithInfo = mostActiveUsers.map((log) => {
      const user = users.find((u) => u.id === log.userId);
      return {
        ...log,
        user,
      };
    });

    return {
      total_logs: totalLogs,
      logs_today: logsToday,
      logs_by_action: logsByAction.reduce((acc, item) => {
        acc[item.accion] = item._count.id;
        return acc;
      }, {}),
      logs_by_table: logsByTable.reduce((acc, item) => {
        acc[item.tabla] = item._count.id;
        return acc;
      }, {}),
      most_active_users: mostActiveUsersWithInfo,
    };
  }

  // Método para crear logs de auditoría desde el interceptor
  async logAction(
    userId: string,
    accion: string,
    tabla: string,
    registroId?: string,
    datosAntes?: any,
    datosDespues?: any,
    ip?: string,
    userAgent?: string,
  ) {
    try {
      console.log(`📝 Creating audit log: ${accion} on ${tabla} by user ${userId}`);
      
      // Función para truncar datos JSON si son demasiado largos
      const truncateJson = (
        data: any,
        maxLength: number = 1000, // Reducido a 1000 caracteres para SQL Server
      ): string | null => {
        if (!data) return null;

        const jsonString = JSON.stringify(data);
        if (jsonString.length <= maxLength) {
          return jsonString;
        }

        // Para acciones de estadísticas y dashboard, guardamos solo un resumen mínimo
        if (tabla === 'dashboard' || accion === 'VIEW_STATISTICS') {
          return JSON.stringify({
            _truncated: true,
            _action: accion,
            _table: tabla,
            _originalSize: jsonString.length,
            _timestamp: new Date().toISOString(),
            _note: 'Large statistics data truncated for audit storage',
          });
        }

        // Si es demasiado largo, guardamos solo un resumen
        if (typeof data === 'object' && data !== null) {
          const summary = {
            _truncated: true,
            _originalLength: jsonString.length,
            _type: Array.isArray(data) ? 'array' : 'object',
            _itemCount: Array.isArray(data)
              ? data.length
              : Object.keys(data as object).length,
            _sample: Array.isArray(data)
              ? data.slice(0, 1) // Solo el primer elemento
              : Object.fromEntries(Object.entries(data as object).slice(0, 2)), // Solo 2 propiedades
          };
          const summaryString = JSON.stringify(summary);
          
          // Si el resumen sigue siendo muy largo, truncamos más
          if (summaryString.length > maxLength) {
            return JSON.stringify({
              _truncated: true,
              _originalLength: jsonString.length,
              _type: Array.isArray(data) ? 'array' : 'object',
              _note: 'Data too large for audit storage',
            });
          }
          
          return summaryString;
        }

        // Para strings largos, truncamos con elipsis
        return jsonString.substring(0, maxLength - 20) + '...[TRUNCATED]';
      };
      
      const auditLog = await this.prisma.auditLog.create({
        data: {
          userId,
          accion,
          tabla,
          registroId,
          datosAntes: truncateJson(datosAntes),
          datosDespues: truncateJson(datosDespues),
          ip,
          userAgent,
        },
      });
      
      console.log(`✅ Audit log created successfully with ID: ${auditLog.id}`);
      return auditLog;
    } catch (error) {
      // Log the error but don't throw to avoid breaking the main operation
      console.error('❌ Error creating audit log:', error);
      console.error('   - UserId:', userId);
      console.error('   - Action:', accion);
      console.error('   - Table:', tabla);
    }
  } // Métodos que no deberían estar disponibles públicamente
  update(): never {
    throw new Error('Audit logs cannot be updated');
  }

  remove(): never {
    throw new Error('Audit logs cannot be deleted');
  }
}
