import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración global de validación
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  // Configuración de cookies
  // app.use(cookieParser()); // Configuración de CORS
  app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));
  // Parse comma-separated origins from FRONTEND_URL
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : [
        'http://localhost:4200',
        'https://fact-amdc.netlify.app',
        'http://localhost:8100',
      ];
  app.enableCors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Verificar si el origen está permitido
      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.includes('*')
      ) {
        callback(null, true);
      } else {
        console.log(`Origen bloqueado: ${origin}`);
        callback(null, false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Sistema de Gestión de Mercados')
    .setDescription(
      'API para la gestión de mercados municipales, locales comerciales y facturación',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y autorización')
    .addTag('users', 'Gestión de usuarios')
    .addTag('mercados', 'Gestión de mercados')
    .addTag('locales', 'Gestión de locales comerciales')
    .addTag('facturas', 'Gestión de facturas y facturación')
    .addTag('audit', 'Auditoría del sistema')
    .addTag('Dashboard', 'Estadísticas y métricas del dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
  console.log(`📚 Documentación Swagger en: http://localhost:${port}/api`);
}

bootstrap().catch((error) =>
  console.error('Error starting application:', error),
);
