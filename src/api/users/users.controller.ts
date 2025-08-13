import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Role } from '../../common/enums';
import { User } from '@prisma/client';

@ApiTags('users')
@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'CREATE', table: 'users' })
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo o DNI ya existe',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'LIST', table: 'users' })
  @ApiOperation({ summary: 'Obtener lista de usuarios' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Elementos por página',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: Role,
    description: 'Filtrar por rol',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
  })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: Role,
  ) {
    return this.usersService.findAll(page, limit, role);
  }

  @Get('stats')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'VIEW_STATS', table: 'users' })
  @ApiOperation({ summary: 'Obtener estadísticas de usuarios' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
  })
  getMyProfile(@GetUser() currentUser: User) {
    return this.usersService.findOne(currentUser.id);
  }

  @Patch('me')
  @AuditLog({ action: 'UPDATE_PROFILE', table: 'users' })
  @ApiOperation({
    summary: 'Actualizar mi perfil',
    description:
      'Permite al usuario actualizar sus propios datos (excluyendo campos administrativos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado exitosamente',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo o nombre de usuario ya existe',
  })
  updateMyProfile(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    // Filtrar campos que los usuarios normales no pueden actualizar
    const allowedFields = [
      'nombre',
      'apellido',
      'telefono',
      'correo',
      'username',
      'contrasena',
    ];
    const filteredDto: Partial<UpdateUserDto> = {};

    allowedFields.forEach((field) => {
      if (updateUserDto[field] !== undefined) {
        filteredDto[field] = updateUserDto[field];
      }
    });

    return this.usersService.update(
      currentUser.id,
      filteredDto as UpdateUserDto,
      currentUser,
    );
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MARKET)
  @AuditLog({ action: 'VIEW', table: 'users' })
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @AuditLog({ action: 'UPDATE', table: 'users' })
  @ApiOperation({
    summary: 'Actualizar usuario',
    description:
      'Los ADMIN pueden actualizar cualquier usuario. Los usuarios pueden actualizar sus propios datos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'No tienes permisos para actualizar este usuario',
  })
  @ApiResponse({
    status: 409,
    description: 'El correo o DNI ya existe',
  })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: User,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'DELETE', table: 'users' })
  @ApiOperation({ summary: 'Desactivar usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario desactivado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'ACTIVATE', table: 'users' })
  @ApiOperation({ summary: 'Activar usuario' })
  @ApiResponse({
    status: 200,
    description: 'Usuario activado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  @Patch(':id/reset-password')
  @Roles(Role.ADMIN)
  @AuditLog({ action: 'RESET_PASSWORD', table: 'users' })
  @ApiOperation({
    summary: 'Restablecer contraseña de usuario',
    description:
      'Solo administradores pueden restablecer contraseñas de otros usuarios',
  })
  @ApiResponse({
    status: 200,
    description: 'Contraseña restablecida exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuario no encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - Solo administradores',
  })
  resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto);
  }
}
