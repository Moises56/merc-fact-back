import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMercadoDto } from './dto/create-mercado.dto';
import { UpdateMercadoDto } from './dto/update-mercado.dto';

@Injectable()
export class MercadosService {
  constructor(private prisma: PrismaService) {}

  async create(createMercadoDto: CreateMercadoDto) {
    // Check if market with same name already exists
    const existingMercado = await this.prisma.mercado.findFirst({
      where: { nombre_mercado: createMercadoDto.nombre_mercado },
    });

    if (existingMercado) {
      throw new ConflictException({
        message: 'No se puede crear el mercado',
        error: 'Ya existe un mercado con ese nombre',
        statusCode: 409,
      });
    }

    const mercado = await this.prisma.mercado.create({
      data: {
        nombre_mercado: createMercadoDto.nombre_mercado,
        direccion: createMercadoDto.direccion,
        latitud: createMercadoDto.latitud,
        longitud: createMercadoDto.longitud,
        descripcion: createMercadoDto.descripcion,
        isActive: true,
      },
      include: {
        locales: {
          select: {
            id: true,
            numero_local: true,
            estado_local: true,
            tipo_local: true,
          },
        },
        _count: {
          select: {
            locales: true,
          },
        },
      },
    });

    return {
      message: 'Mercado creado exitosamente',
      data: mercado,
    };
  }
  async findAll(page: number = 1, limit: number = 10, activo?: boolean) {
    const skip = (page - 1) * limit;

    // Transform activo parameter to isActive for Prisma query
    const where = activo !== undefined ? { isActive: activo } : {};

    const [mercados, total] = await Promise.all([
      this.prisma.mercado.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              locales: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.mercado.count({ where }),
    ]);

    return {
      data: mercados,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  async findOne(id: string) {
    const mercado = await this.prisma.mercado.findUnique({
      where: { id },
      include: {
        locales: {
          include: {
            facturas: {
              select: {
                id: true,
                mes: true,
                anio: true,
                monto: true,
                estado: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        },
        _count: {
          select: {
            locales: true,
          },
        },
      },
    });

    if (!mercado) {
      throw new NotFoundException({
        message: 'Mercado no encontrado',
        error: 'El mercado solicitado no existe en el sistema',
        statusCode: 404,
      });
    }

    return mercado;
  }
  async update(id: string, updateMercadoDto: UpdateMercadoDto) {
    await this.findOne(id);

    // Check for name conflicts if name is being updated
    if (updateMercadoDto.nombre_mercado) {
      const existingMercado = await this.prisma.mercado.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { nombre_mercado: updateMercadoDto.nombre_mercado },
          ],
        },
      });
      if (existingMercado) {
        throw new ConflictException({
          message: 'No se puede actualizar el mercado',
          error: 'Ya existe un mercado con ese nombre',
          statusCode: 409,
        });
      }
    }

    // Transform activo field to isActive for Prisma
    const { activo, ...restData } = updateMercadoDto;
    const prismaData = {
      ...restData,
      ...(activo !== undefined && { isActive: activo }),
    };
    const updatedMercado = await this.prisma.mercado.update({
      where: { id },
      data: prismaData,
      include: {
        _count: {
          select: {
            locales: true,
          },
        },
      },
    });

    return {
      message: 'Mercado actualizado exitosamente',
      data: updatedMercado,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    // Check if market has active locales
    const activeLocales = await this.prisma.local.count({
      where: {
        mercadoId: id,
        estado_local: 'OCUPADO',
      },
    });
    if (activeLocales > 0) {
      throw new ConflictException({
        message: 'No se puede desactivar el mercado',
        error: `El mercado tiene ${activeLocales} locales ocupados. Debe liberar todos los locales antes de desactivarlo`,
        statusCode: 409,
      });
    }

    // Soft delete - set isActive to false
    await this.prisma.mercado.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'Mercado desactivado exitosamente',
      data: { id, isActive: false },
    };
  }
  async activate(id: string) {
    const mercado = await this.prisma.mercado.findUnique({
      where: { id },
    });

    if (!mercado) {
      throw new NotFoundException({
        message: 'Mercado no encontrado',
        error: 'El mercado solicitado no existe en el sistema',
        statusCode: 404,
      });
    }

    await this.prisma.mercado.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      message: 'Mercado activado exitosamente',
      data: { id, isActive: true },
    };
  }
  async getMercadoStats() {
    const totalMercados = await this.prisma.mercado.count({
      where: { isActive: true },
    });

    const mercadosWithLocales = await this.prisma.mercado.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            locales: true,
          },
        },
      },
    });

    const totalLocales = mercadosWithLocales.reduce(
      (sum: number, mercado: any) => sum + (mercado._count?.locales || 0),
      0,
    );

    const ocupiedLocales = await this.prisma.local.count({
      where: {
        estado_local: 'OCUPADO',
        mercado: {
          isActive: true,
        },
      },
    });

    return {
      total_mercados: totalMercados,
      total_locales: totalLocales,
      locales_ocupados: ocupiedLocales,
      locales_libres: totalLocales - ocupiedLocales,
      ocupacion_percentage:
        totalLocales > 0 ? (ocupiedLocales / totalLocales) * 100 : 0,
    };
  }
}
