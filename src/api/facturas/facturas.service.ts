import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFacturaDto } from './dto/create-factura.dto';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { EstadoFactura } from '../../common/enums';

@Injectable()
export class FacturasService {
  constructor(private prisma: PrismaService) {}

  async create(createFacturaDto: CreateFacturaDto) {
    // Verificar que el local existe
    const local = await this.prisma.local.findUnique({
      where: { id: createFacturaDto.localId },
      include: {
        mercado: true,
      },
    });

    if (!local) {
      throw new NotFoundException('Local no encontrado');
    }

    // Verificar que no existe una factura para el mismo local, mes y año
    const existingFactura = await this.prisma.factura.findFirst({
      where: {
        localId: createFacturaDto.localId,
        mes: createFacturaDto.mes,
        anio: createFacturaDto.anio,
      },
    });

    if (existingFactura) {
      throw new ConflictException(
        'Ya existe una factura para este local en el mes y año especificado',
      );
    }

    // Generar correlativo único
    const correlativo = await this.generateCorrelativo();

    const factura = await this.prisma.factura.create({
      data: {
        ...createFacturaDto,
        correlativo,
        mercado_nombre: local.mercado.nombre_mercado,
        local_nombre: local.nombre_local,
        local_numero: local.numero_local,
        propietario_nombre: local.propietario,
        propietario_dni: local.dni_propietario,
      },
      include: {
        local: {
          include: {
            mercado: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });

    return factura;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    estado?: EstadoFactura,
    localId?: string,
    mercadoId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado) {
      where.estado = estado;
    }

    if (localId) {
      where.localId = localId;
    }

    if (mercadoId) {
      where.local = {
        mercadoId: mercadoId,
      };
    }

    const [facturas, total] = await Promise.all([
      this.prisma.factura.findMany({
        where,
        include: {
          local: {
            include: {
              mercado: true,
            },
          },
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
      this.prisma.factura.count({ where }),
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

  async findOne(id: string) {
    const factura = await this.prisma.factura.findUnique({
      where: { id },
      include: {
        local: {
          include: {
            mercado: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });

    if (!factura) {
      throw new NotFoundException('Factura no encontrada');
    }

    return factura;
  }

  async update(id: string, updateFacturaDto: UpdateFacturaDto) {
    const factura = await this.prisma.factura.findUnique({
      where: { id },
    });

    if (!factura) {
      throw new NotFoundException('Factura no encontrada');
    }

    // Si se está actualizando a PAGADA, establecer fecha de pago
    if (
      updateFacturaDto.estado === EstadoFactura.PAGADA &&
      !updateFacturaDto.fecha_pago
    ) {
      // FIX 1: Convertir Date a string ISO
      updateFacturaDto.fecha_pago = new Date().toISOString();
    }

    const updatedFactura = await this.prisma.factura.update({
      where: { id },
      data: updateFacturaDto,
      include: {
        local: {
          include: {
            mercado: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });

    return updatedFactura;
  }

  async remove(id: string) {
    const factura = await this.prisma.factura.findUnique({
      where: { id },
    });

    if (!factura) {
      throw new NotFoundException('Factura no encontrada');
    }

    await this.prisma.factura.delete({
      where: { id },
    });

    return { message: 'Factura eliminada exitosamente' };
  }

  async generateMassiveInvoices(
    mercadoId: string,
    mes: string,
    anio: number,
    createdByUserId: string,
  ) {
    // Verificar que el mercado existe
    const mercado = await this.prisma.mercado.findUnique({
      where: { id: mercadoId },
    });

    if (!mercado) {
      throw new NotFoundException('Mercado no encontrado');
    }

    // Obtener todos los locales activos del mercado
    const locales = await this.prisma.local.findMany({
      where: {
        mercadoId,
        estado_local: 'ACTIVO',
      },
      include: {
        mercado: true,
      },
    });

    if (locales.length === 0) {
      throw new BadRequestException('No hay locales activos en este mercado');
    }

    // Verificar que no existan facturas para este mes/año
    const existingFacturas = await this.prisma.factura.findMany({
      where: {
        mes,
        anio,
        localId: {
          in: locales.map((local) => local.id),
        },
      },
    });

    if (existingFacturas.length > 0) {
      throw new ConflictException(
        `Ya existen ${existingFacturas.length} facturas para el mes ${mes}/${anio} en este mercado`,
      );
    }

    // Generar facturas para todos los locales
    const facturasData = await Promise.all(
      locales.map(async (local) => {
        const correlativo = await this.generateCorrelativo();
        return {
          concepto: `Cuota mensual ${mes}/${anio} - ${local.nombre_local}`,
          mes,
          anio,
          monto: local.monto_mensual,
          estado: EstadoFactura.PENDIENTE,
          fecha_vencimiento: this.calculateDueDate(mes, anio),
          mercado_nombre: local.mercado.nombre_mercado,
          local_nombre: local.nombre_local,
          local_numero: local.numero_local,
          propietario_nombre: local.propietario,
          propietario_dni: local.dni_propietario,
          localId: local.id,
          createdByUserId,
          correlativo,
        };
      }),
    );

    const facturas = await this.prisma.factura.createMany({
      data: facturasData,
    });

    return {
      message: `Se generaron ${facturas.count} facturas exitosamente`,
      count: facturas.count,
    };
  }

  async markAsPaid(id: string) {
    const factura = await this.prisma.factura.findUnique({
      where: { id },
    });

    if (!factura) {
      throw new NotFoundException('Factura no encontrada');
    }

    if (factura.estado === EstadoFactura.PAGADA) {
      throw new BadRequestException('La factura ya está marcada como pagada');
    }

    const updatedFactura = await this.prisma.factura.update({
      where: { id },
      data: {
        estado: EstadoFactura.PAGADA,
        fecha_pago: new Date(),
      },
    });

    return updatedFactura;
  }

  async getFacturaStats() {
    const [
      totalFacturas,
      facturasPendientes,
      facturasPagadas,
      facturasVencidas,
      facturasAnuladas,
      totalMonto,
      montoRecaudado,
    ] = await Promise.all([
      this.prisma.factura.count(),
      this.prisma.factura.count({
        where: { estado: EstadoFactura.PENDIENTE },
      }),
      this.prisma.factura.count({
        where: { estado: EstadoFactura.PAGADA },
      }),
      this.prisma.factura.count({
        where: { estado: EstadoFactura.VENCIDA },
      }),
      this.prisma.factura.count({
        where: { estado: EstadoFactura.ANULADA },
      }),
      this.prisma.factura.aggregate({
        _sum: { monto: true },
      }),
      this.prisma.factura.aggregate({
        _sum: { monto: true },
        where: { estado: EstadoFactura.PAGADA },
      }),
    ]);

    // FIX 2: Convertir a número los valores de Decimal
    const totalMontoValue = Number(totalMonto._sum.monto) || 0;
    const montoRecaudadoValue = Number(montoRecaudado._sum.monto) || 0;

    return {
      total_facturas: totalFacturas,
      facturas_pendientes: facturasPendientes,
      facturas_pagadas: facturasPagadas,
      facturas_vencidas: facturasVencidas,
      facturas_anuladas: facturasAnuladas,
      monto_total: totalMontoValue,
      monto_recaudado: montoRecaudadoValue,
      porcentaje_recaudacion: totalMontoValue
        ? (montoRecaudadoValue / totalMontoValue) * 100
        : 0,
    };
  }

  private async generateCorrelativo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${year}-`;

    const lastFactura = await this.prisma.factura.findFirst({
      where: {
        correlativo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        correlativo: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastFactura) {
      const lastNumber = parseInt(lastFactura.correlativo.split('-')[1]);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  private calculateDueDate(mes: string, anio: number): Date {
    // Fecha de vencimiento: último día del mes siguiente
    const [year, month] = mes.split('-').map(Number);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? anio + 1 : anio;

    // Último día del mes
    const dueDate = new Date(nextYear, nextMonth, 0);
    return dueDate;
  }
}
