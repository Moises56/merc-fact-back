import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../../common/enums';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists - validate unique fields
    const conditions: any[] = [
      { correo: createUserDto.correo },
      { username: createUserDto.username },
      { dni: createUserDto.dni },
    ];

    // Add numero_empleado to validation if provided
    if (
      createUserDto.numero_empleado !== undefined &&
      createUserDto.numero_empleado !== null
    ) {
      conditions.push({ numero_empleado: createUserDto.numero_empleado });
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: conditions,
      },
    });

    if (existingUser) {
      if (existingUser.correo === createUserDto.correo) {
        throw new ConflictException('El correo electrónico ya está en uso');
      }
      if (existingUser.username === createUserDto.username) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
      if (existingUser.dni === createUserDto.dni) {
        throw new ConflictException('El DNI ya está registrado');
      }
      // numero de empleado
      if (existingUser.numero_empleado === createUserDto.numero_empleado) {
        throw new ConflictException('El número de empleado ya está registrado');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.contrasena, 12);

    const user = await this.prisma.user.create({
      data: {
        correo: createUserDto.correo,
        username: createUserDto.username,
        nombre: createUserDto.nombre,
        apellido: createUserDto.apellido,
        contrasena: hashedPassword,
        telefono: createUserDto.telefono,
        dni: createUserDto.dni,
        gerencia: createUserDto.gerencia,
        numero_empleado: createUserDto.numero_empleado,
        role: createUserDto.role || Role.USER,
        isActive: true,
      },
      select: {
        id: true,
        correo: true,
        username: true,
        nombre: true,
        apellido: true,
        telefono: true,
        dni: true,
        gerencia: true,
        numero_empleado: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(page: number = 1, limit: number = 10, role?: Role) {
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          userLocations: {
            where: { isActive: true },
            select: { locationName: true },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Mapear la respuesta para incluir ubicación y excluir campos sensibles
    const mappedUsers = users.map((user) => ({
      id: user.id,
      correo: user.correo,
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
      dni: user.dni,
      gerencia: user.gerencia,
      numero_empleado: user.numero_empleado,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      ubicacion: user.userLocations[0]?.locationName || user.ubicacion || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      data: mappedUsers,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        correo: true,
        username: true,
        nombre: true,
        apellido: true,
        telefono: true,
        dni: true,
        gerencia: true,
        numero_empleado: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(correo: string) {
    return this.prisma.user.findUnique({
      where: { correo },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: any) {
    await this.findOne(id);

    // Verificar permisos: Solo ADMIN puede actualizar cualquier usuario
    // Los usuarios regulares solo pueden actualizar sus propios datos
    if (currentUser) {
      const isAdmin = currentUser.role === 'ADMIN';
      const isOwnProfile = currentUser.id === id;
      
      if (!isAdmin && !isOwnProfile) {
        throw new ForbiddenException(
          'No tienes permisos para actualizar este usuario',
        );
      }

      // Si no es ADMIN, restringir qué campos puede actualizar
      if (!isAdmin) {
        // Los usuarios regulares no pueden cambiar ciertos campos críticos
        const restrictedFields = ['role', 'isActive', 'numero_empleado'];
        const hasRestrictedFields = restrictedFields.some((field) =>
          Object.prototype.hasOwnProperty.call(updateUserDto, field),
        );
        
        if (hasRestrictedFields) {
          throw new ForbiddenException(
            'No tienes permisos para actualizar estos campos',
          );
        }
      }
    }

    // Check for conflicts if email, username, DNI, or numero_empleado is being updated
    if (
      updateUserDto.correo ||
      updateUserDto.username ||
      updateUserDto.dni ||
      updateUserDto.numero_empleado !== undefined
    ) {
      const conditions: any[] = [];

      if (updateUserDto.correo) {
        conditions.push({ correo: updateUserDto.correo });
      }
      if (updateUserDto.username) {
        conditions.push({ username: updateUserDto.username });
      }
      if (updateUserDto.dni) {
        conditions.push({ dni: updateUserDto.dni });
      }
      if (
        updateUserDto.numero_empleado !== undefined &&
        updateUserDto.numero_empleado !== null
      ) {
        conditions.push({ numero_empleado: updateUserDto.numero_empleado });
      }

      if (conditions.length > 0) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: conditions,
              },
            ],
          },
        });

        if (existingUser) {
          if (existingUser.correo === updateUserDto.correo) {
            throw new ConflictException('El correo electrónico ya está en uso');
          }
          if (existingUser.username === updateUserDto.username) {
            throw new ConflictException('El nombre de usuario ya está en uso');
          }
          if (existingUser.dni === updateUserDto.dni) {
            throw new ConflictException('El DNI ya está registrado');
          }
          if (existingUser.numero_empleado === updateUserDto.numero_empleado) {
            throw new ConflictException(
              'El número de empleado ya está registrado',
            );
          }
        }
      }
    }

    // Hash password if provided
    const updateData: Partial<UpdateUserDto> & { contrasena?: string } = {
      ...updateUserDto,
    };
    if (updateUserDto.contrasena) {
      updateData.contrasena = await bcrypt.hash(updateUserDto.contrasena, 12);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        correo: true,
        username: true,
        nombre: true,
        apellido: true,
        telefono: true,
        dni: true,
        gerencia: true,
        numero_empleado: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete - set isActive to false
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Usuario desactivado exitosamente' };
  }

  async activate(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return { message: 'Usuario activado exitosamente' };
  }
  async getUserStats() {
    const stats = await this.prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
      where: {
        isActive: true,
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    const activeUsersLastMonth = await this.prisma.user.count({
      where: {
        isActive: true,
        lastLogin: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      total_users: totalUsers,
      active_last_month: activeUsersLastMonth,
      by_role: stats.reduce((acc: Record<string, number>, stat) => {
        acc[stat.role] = stat._count?.id || 0;
        return acc;
      }, {}),
    };
  }

  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    // Update user password
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        contrasena: hashedPassword,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        correo: true,
        username: true,
        nombre: true,
        apellido: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Contraseña restablecida exitosamente',
      user: updatedUser,
    };
  }
}
