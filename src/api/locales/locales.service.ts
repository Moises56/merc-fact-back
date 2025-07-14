import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLocaleDto } from './dto/create-local.dto';
import { UpdateLocalDto } from './dto/update-local.dto';
import { EstadoLocal, TipoLocal } from '../../common/enums';

@Injectable()
export class LocalesService {
  constructor(private prisma: PrismaService) {}
  async create(createLocaleDto: CreateLocaleDto) {
    // Verificar que el mercado existe
    const mercado = await this.prisma.mercado.findUnique({
      where: { id: createLocaleDto.mercadoId },
    });

    if (!mercado) {
      throw new NotFoundException('Mercado no encontrado');
    }    // Verificar que el número de local y permiso de operación sean únicos (solo si se proporcionan)
    const uniqueConstraints: Array<{ numero_local?: string } | { permiso_operacion?: string }> = [];
    if (createLocaleDto.numero_local) {
      uniqueConstraints.push({ numero_local: createLocaleDto.numero_local });
    }
    if (createLocaleDto.permiso_operacion) {
      uniqueConstraints.push({
        permiso_operacion: createLocaleDto.permiso_operacion,
      });
    }

    if (uniqueConstraints.length > 0) {
      const existingLocal = await this.prisma.local.findFirst({
        where: {
          OR: uniqueConstraints,
        },
      });

      if (existingLocal) {
        throw new ConflictException(
          'Ya existe un local con ese número o permiso de operación',
        );
      }
    }

    const local = await this.prisma.local.create({
      data: {
        ...createLocaleDto,
        estado_local: createLocaleDto.estado_local || 'PENDIENTE',
      },
      include: {
        mercado: true,
        _count: {
          select: {
            facturas: true,
          },
        },
      },
    });

    return local;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    estado?: EstadoLocal,
    tipo?: TipoLocal,
    mercadoId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado) {
      where.estado_local = estado;
    }

    if (tipo) {
      where.tipo_local = tipo;
    }

    if (mercadoId) {
      where.mercadoId = mercadoId;
    }

    const [locales, total] = await Promise.all([
      this.prisma.local.findMany({
        where,
        include: {
          mercado: {
            select: {
              id: true,
              nombre_mercado: true,
              direccion: true,
            },
          },
          _count: {
            select: {
              facturas: true,
            },
          },
        },
        orderBy: {
          numero_local: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.local.count({ where }),
    ]);

    return {
      data: locales,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const local = await this.prisma.local.findUnique({
      where: { id },
      include: {
        mercado: true,
        facturas: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Últimas 10 facturas
        },
        _count: {
          select: {
            facturas: true,
          },
        },
      },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    return local;
  }

  async update(id: string, updateLocalDto: UpdateLocalDto) {
    const local = await this.prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    // Verificar únicos si se están actualizando
    if (updateLocalDto.numero_local || updateLocalDto.permiso_operacion) {
      const existingLocal = await this.prisma.local.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateLocalDto.numero_local
                  ? { numero_local: updateLocalDto.numero_local }
                  : {},
                updateLocalDto.permiso_operacion
                  ? { permiso_operacion: updateLocalDto.permiso_operacion }
                  : {},
              ],
            },
          ],
        },
      });

      if (existingLocal) {
        throw new ConflictException(
          'Ya existe un local con ese número o permiso de operación',
        );
      }
    }

    const updatedLocal = await this.prisma.local.update({
      where: { id },
      data: updateLocalDto,
      include: {
        mercado: true,
        _count: {
          select: {
            facturas: true,
          },
        },
      },
    });

    return updatedLocal;
  }

  async remove(id: string) {
    const local = await this.prisma.local.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            facturas: true,
          },
        },
      },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    if (local._count.facturas > 0) {
      throw new ConflictException(
        'No se puede eliminar el local porque tiene facturas asociadas',
      );
    }

    await this.prisma.local.delete({
      where: { id },
    });

    return { message: 'Local eliminado exitosamente' };
  }

  async activate(id: string) {
    const local = await this.prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    await this.prisma.local.update({
      where: { id },
      data: { estado_local: EstadoLocal.ACTIVO },
    });

    return { message: 'Local activado exitosamente' };
  }

  async deactivate(id: string) {
    const local = await this.prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    await this.prisma.local.update({
      where: { id },
      data: { estado_local: EstadoLocal.INACTIVO },
    });

    return { message: 'Local desactivado exitosamente' };
  }

  async suspend(id: string) {
    const local = await this.prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    await this.prisma.local.update({
      where: { id },
      data: { estado_local: EstadoLocal.SUSPENDIDO },
    });

    return { message: 'Local suspendido exitosamente' };
  }

  async getLocalStats() {
    const [
      totalLocales,
      localesActivos,
      localesInactivos,
      localesSuspendidos,
      localesPendientes,
      estadisticasPorTipo,
      promedioMonto,
    ] = await Promise.all([
      this.prisma.local.count(),
      this.prisma.local.count({
        where: { estado_local: EstadoLocal.ACTIVO },
      }),
      this.prisma.local.count({
        where: { estado_local: EstadoLocal.INACTIVO },
      }),
      this.prisma.local.count({
        where: { estado_local: EstadoLocal.SUSPENDIDO },
      }),
      this.prisma.local.count({
        where: { estado_local: EstadoLocal.PENDIENTE },
      }),
      this.prisma.local.groupBy({
        by: ['tipo_local'],
        _count: {
          id: true,
        },
      }),
      this.prisma.local.aggregate({
        _avg: {
          monto_mensual: true,
        },
      }),
    ]);

    return {
      total_locales: totalLocales,
      locales_activos: localesActivos,
      locales_inactivos: localesInactivos,
      locales_suspendidos: localesSuspendidos,
      locales_pendientes: localesPendientes,
      porcentaje_activos:
        totalLocales > 0 ? (localesActivos / totalLocales) * 100 : 0,
      estadisticas_por_tipo: estadisticasPorTipo.reduce((acc, item) => {
        const tipoLocal = item.tipo_local || 'SIN_TIPO';
        acc[tipoLocal] = item._count.id;
        return acc;
      }, {}),
      monto_promedio: promedioMonto._avg.monto_mensual || 0,
    };
  }

  async getFacturasByLocal(id: string, page: number = 1, limit: number = 10) {
    const local = await this.prisma.local.findUnique({
      where: { id },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    const skip = (page - 1) * limit;

    const [facturas, total] = await Promise.all([
      this.prisma.factura.findMany({
        where: { localId: id },
        include: {
          createdBy: {
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
      this.prisma.factura.count({
        where: { localId: id },
      }),
    ]);

    return {
      data: facturas,
      pagination: {
        current_page: page,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getLocalStatsById(id: string) {
    // Verificar que el local existe
    const local = await this.prisma.local.findUnique({
      where: { id },
      include: {
        mercado: {
          select: {
            id: true,
            nombre_mercado: true,
          },
        },
      },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    const [
      totalFacturas,
      facturasPendientes,
      facturasPagadas,
      facturasVencidas,
      facturasAnuladas,
      totalRecaudado,
      montoTotal,
    ] = await Promise.all([
      // Total de facturas del local
      this.prisma.factura.count({
        where: { localId: id },
      }),

      // Facturas pendientes
      this.prisma.factura.count({
        where: { 
          localId: id,
          estado: 'PENDIENTE',
        },
      }),

      // Facturas pagadas
      this.prisma.factura.count({
        where: { 
          localId: id,
          estado: 'PAGADA',
        },
      }),

      // Facturas vencidas
      this.prisma.factura.count({
        where: { 
          localId: id,
          estado: 'VENCIDA',
        },
      }),

      // Facturas anuladas
      this.prisma.factura.count({
        where: { 
          localId: id,
          estado: 'ANULADA',
        },
      }),

      // Total recaudado (facturas pagadas)
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: { 
          localId: id,
          estado: 'PAGADA',
        },
      }),

      // Monto total de todas las facturas
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: { localId: id },
      }),
    ]);

    // Calcular recaudo esperado
    const montoMensual = Number(local.monto_mensual) || 0;
    const recaudoEsperadoMensual = montoMensual;
    const recaudoEsperadoAnual = montoMensual * 12;

    // Convertir valores Decimal a número
    const totalRecaudadoValue = Number(totalRecaudado._sum?.monto) || 0;
    const montoTotalValue = Number(montoTotal._sum?.monto) || 0;

    return {
      local_id: local.id,
      local_nombre: local.nombre_local || 'Sin nombre',
      local_numero: local.numero_local || 'Sin número',
      local_estado: local.estado_local,
      mercado: {
        id: local.mercado.id,
        nombre: local.mercado.nombre_mercado,
      },
      estadisticas_facturas: {
        total_facturas: totalFacturas,
        facturas_pendientes: facturasPendientes,
        facturas_pagadas: facturasPagadas,
        facturas_vencidas: facturasVencidas,
        facturas_anuladas: facturasAnuladas,
      },
      estadisticas_financieras: {
        total_recaudado: totalRecaudadoValue,
        monto_total_facturas: montoTotalValue,
        monto_pendiente: montoTotalValue - totalRecaudadoValue,
        recaudo_esperado_mensual: recaudoEsperadoMensual,
        recaudo_esperado_anual: recaudoEsperadoAnual,
        porcentaje_recaudacion:
          montoTotalValue > 0
            ? Math.round((totalRecaudadoValue / montoTotalValue) * 100 * 100) /
              100
            : 0,
      },
    };
  }
}
