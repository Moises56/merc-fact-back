import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserStatsSeederService {
  private readonly logger = new Logger(UserStatsSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedUserAdminAndLocations(): Promise<void> {
    try {
      this.logger.log('🌱 Iniciando seed de USER-ADMIN y ubicaciones...');

      // 1. Crear usuarios USER-ADMIN
      const hashedPassword = await bcrypt.hash('admin123', 12);

      const userAdmin = await this.prisma.user.upsert({
        where: { correo: 'user.admin@mercados.hn' },
        update: {},
        create: {
          correo: 'user.admin@mercados.hn',
          username: 'useradmin',
          nombre: 'Usuario',
          apellido: 'Administrador',
          contrasena: hashedPassword,
          telefono: '+504 9999-9999',
          dni: '0801-1990-99999',
          gerencia: 'Administración de Usuarios',
          numero_empleado: 9999,
          role: 'USER-ADMIN',
          isActive: true,
        },
      });

      this.logger.log(`✅ Usuario USER-ADMIN creado: ${userAdmin.username}`);

      // 2. Crear usuarios USER regulares con ubicaciones
      const locations = [
        {
          name: 'Mall Multiplaza',
          code: 'MULT_001',
          description: 'Centro comercial Mall Multiplaza - Plaza principal',
        },
        {
          name: 'Centro Histórico',
          code: 'CENTRO_001',
          description: 'Oficina del centro histórico de Tegucigalpa',
        },
        {
          name: 'Comayagüela',
          code: 'COMAY_001',
          description: 'Oficina de Comayagüela - Zona central',
        },
        {
          name: 'San Pedro Sula',
          code: 'SPS_001',
          description: 'Oficina regional de San Pedro Sula',
        },
      ];

      const users = [
        {
          correo: 'juan.perez@mercados.hn',
          username: 'jperez',
          nombre: 'Juan',
          apellido: 'Pérez',
          dni: '0801-1985-12345',
          location: locations[0],
        },
        {
          correo: 'maria.rodriguez@mercados.hn',
          username: 'mrodriguez',
          nombre: 'María',
          apellido: 'Rodríguez',
          dni: '0801-1990-67890',
          location: locations[1],
        },
        {
          correo: 'carlos.martinez@mercados.hn',
          username: 'cmartinez',
          nombre: 'Carlos',
          apellido: 'Martínez',
          dni: '0801-1988-54321',
          location: locations[2],
        },
        {
          correo: 'ana.garcia@mercados.hn',
          username: 'agarcia',
          nombre: 'Ana',
          apellido: 'García',
          dni: '0801-1992-98765',
          location: locations[3],
        },
      ];

      for (const userData of users) {
        const user = await this.prisma.user.upsert({
          where: { correo: userData.correo },
          update: {},
          create: {
            correo: userData.correo,
            username: userData.username,
            nombre: userData.nombre,
            apellido: userData.apellido,
            contrasena: hashedPassword, // Misma contraseña para pruebas
            telefono: '+504 9999-0000',
            dni: userData.dni,
            gerencia: 'Consultas Tributarias',
            numero_empleado: Math.floor(Math.random() * 9000) + 1000,
            role: 'USER',
            isActive: true,
          },
        });

        // Asignar ubicación al usuario
        await this.prisma.userLocation.upsert({
          where: {
            userId_isActive: {
              userId: user.id,
              isActive: true,
            },
          },
          update: {},
          create: {
            userId: user.id,
            locationName: userData.location.name,
            locationCode: userData.location.code,
            description: userData.location.description,
            isActive: true,
            assignedBy: userAdmin.id,
          },
        });

        this.logger.log(`✅ Usuario ${user.username} creado con ubicación ${userData.location.name}`);
      }

      // 3. Crear logs de consulta de ejemplo
      await this.createSampleConsultaLogs();

      this.logger.log('🎉 Seed de USER-ADMIN y ubicaciones completado exitosamente');
    } catch (error) {
      this.logger.error(`❌ Error en seed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async createSampleConsultaLogs(): Promise<void> {
    try {
      const users = await this.prisma.user.findMany({
        where: { role: 'USER' },
        include: { userLocations: { where: { isActive: true } } },
      });

      if (users.length === 0) {
        this.logger.warn('No hay usuarios USER para crear logs de ejemplo');
        return;
      }

      // Crear logs de los últimos 30 días
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const sampleLogs = [
        {
          consultaType: 'EC',
          consultaSubtype: 'normal',
          parametros: JSON.stringify({ claveCatastral: '12345', dni: '0801123456789' }),
          resultado: 'SUCCESS',
          totalEncontrado: 1500.50,
          duracionMs: 1200,
        },
        {
          consultaType: 'ICS',
          consultaSubtype: 'normal',
          parametros: JSON.stringify({ ics: '67890', dni: '0801987654321' }),
          resultado: 'SUCCESS',
          totalEncontrado: 2300.75,
          duracionMs: 1800,
        },
        {
          consultaType: 'EC',
          consultaSubtype: 'amnistia',
          parametros: JSON.stringify({ claveCatastral: '54321', dni: '0801456789123' }),
          resultado: 'NOT_FOUND',
          duracionMs: 900,
        },
        {
          consultaType: 'ICS',
          consultaSubtype: 'amnistia',
          parametros: JSON.stringify({ ics: '11111', dni: '0801111111111' }),
          resultado: 'ERROR',
          errorMessage: 'Error de conexión con base de datos externa',
          duracionMs: 5000,
        },
      ];

      for (let i = 0; i < 50; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
        const randomDate = new Date(
          thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()),
        );

        await this.prisma.consultaLog.create({
          data: {
            ...randomLog,
            userId: randomUser.id,
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            createdAt: randomDate,
          },
        });
      }

      this.logger.log('✅ Logs de consulta de ejemplo creados');
    } catch (error) {
      this.logger.error(`Error creando logs de ejemplo: ${error.message}`, error.stack);
    }
  }
}
