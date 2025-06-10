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
      await this.prisma.auditLog.create({
        data: {
          userId,
          accion,
          tabla,
          registroId,
          datosAntes: datosAntes ? JSON.stringify(datosAntes) : null,
          datosDespues: datosDespues ? JSON.stringify(datosDespues) : null,
          ip,
          userAgent,
        },
      });
    } catch (error) {
      // Log the error but don't throw to avoid breaking the main operation
      console.error('Error creating audit log:', error);
    }
  }  // Métodos que no deberían estar disponibles públicamente
  update(): never {
    throw new Error('Audit logs cannot be updated');
  }

  remove(): never {
    throw new Error('Audit logs cannot be deleted');
  }
}
