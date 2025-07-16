import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
} from './dto/create-auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { User } from '@prisma/client';

@ApiTags('Autenticación')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔧 Función helper para configuración de cookies
  private getCookieOptions(maxAge: number) {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      secure: isProduction, // Solo HTTPS en producción
      sameSite: isProduction ? ('none' as const) : ('lax' as const), // 'none' para cross-domain
      domain: isProduction ? '.amdc.hn' : undefined, // Dominio compartido
      maxAge,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuditLog({ action: 'LOGIN', table: 'auth' })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // ✅ Configuración correcta para cookies cross-domain

    // Set access token cookie (15 minutos)
    response.cookie(
      'access_token',
      result.access_token,
      this.getCookieOptions(15 * 60 * 1000),
    );

    // Set refresh token cookie (7 días)
    response.cookie(
      'refresh_token',
      result.refresh_token,
      this.getCookieOptions(7 * 24 * 60 * 60 * 1000),
    );

    console.log('🍪 Cookies establecidas:', {
      isProduction: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.amdc.hn' : 'localhost',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return {
      message: 'Inicio de sesión exitoso',
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar token de acceso' })
  @ApiResponse({
    status: 200,
    description: 'Token actualizado exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de refresh inválido',
  })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      return { statusCode: 401, message: 'Token de refresh no encontrado' };
    }

    const result = await this.authService.refreshToken({ refreshToken });

    // ✅ Update access token cookie con configuración correcta
    response.cookie(
      'access_token',
      result.access_token,
      this.getCookieOptions(15 * 60 * 1000),
    );

    console.log('🔄 Access token renovado via cookies');

    return {
      message: 'Token actualizado exitosamente',
    };
  }

  @Post('logout')
  @AuditLog({ action: 'LOGOUT', table: 'auth' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada exitosamente',
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    // ✅ Clear cookies with same configuration as when set
    const clearOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      domain: isProduction ? '.amdc.hn' : undefined,
    };

    response.clearCookie('access_token', clearOptions);
    response.clearCookie('refresh_token', clearOptions);

    console.log('🚪 Cookies limpiadas en logout');

    return this.authService.logout();
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @AuditLog({ action: 'CHANGE_PASSWORD', table: 'users' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña cambiada exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener perfil del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getProfile(@GetUser() user: User) {
    return {
      user: {
        id: user.id,
        correo: user.correo,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        role: user.role,
        telefono: user.telefono,
        dni: user.dni,
        gerencia: user.gerencia,
        numero_empleado: user.numero_empleado,
        ultimo_login: user.lastLogin,
        created_at: user.createdAt,
      },
    };
  }
}
