import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as sql from 'mssql';

@Injectable()
export class ReadonlyDatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(ReadonlyDatabaseService.name);
  private pool: sql.ConnectionPool;
  private readonly config: sql.config;

  constructor() {
    // Log de las variables de entorno para debugging
    this.logger.log('Variables de entorno de BD de solo lectura:');
    this.logger.log(`READONLY_DB_HOST: ${process.env.READONLY_DB_HOST}`);
    this.logger.log(`READONLY_DB_PORT: ${process.env.READONLY_DB_PORT}`);
    this.logger.log(`READONLY_DB_NAME: ${process.env.READONLY_DB_NAME}`);
    this.logger.log(`READONLY_DB_USER: ${process.env.READONLY_DB_USER}`);
    this.logger.log(`READONLY_DB_PASSWORD: ${process.env.READONLY_DB_PASSWORD ? '[CONFIGURADA]' : '[NO CONFIGURADA]'}`);

    this.config = {
      server: process.env.READONLY_DB_HOST,
      port: parseInt(process.env.READONLY_DB_PORT || '1433') || 1433,
      database: process.env.READONLY_DB_NAME,
      user: process.env.READONLY_DB_USER,
      password: process.env.READONLY_DB_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true,
      },
      pool: {
        max: 20,
        min: 5,
        idleTimeoutMillis: 60000,
        acquireTimeoutMillis: 30000,
      },
      connectionTimeout: 60000,
      requestTimeout: 120000,
    };

    // Validar que todas las variables requeridas estén configuradas
    if (!this.config.server || !this.config.database || !this.config.user || !this.config.password) {
      this.logger.error('Faltan variables de entorno requeridas para la base de datos de solo lectura');
      throw new Error('Configuración de base de datos de solo lectura incompleta');
    }
  }

  async getConnection(): Promise<sql.ConnectionPool> {
    if (!this.pool || !this.pool.connected) {
      try {
        this.logger.log('Conectando a la base de datos de solo lectura...');
        this.pool = new sql.ConnectionPool(this.config);
        await this.pool.connect();
        this.logger.log('Conexión establecida exitosamente');
      } catch (error) {
        this.logger.error('Error al conectar a la base de datos:', error.message);
        throw error;
      }
    }
    return this.pool;
  }

  async executeQuery(query: string, parameters?: any): Promise<any[]> {
    const startTime = Date.now();
    try {
      const pool = await this.getConnection();
      const request = pool.request();
      
      // Agregar parámetros si existen
      if (parameters) {
        Object.keys(parameters).forEach(key => {
          this.logger.log(`Agregando parámetro: ${key} = ${parameters[key]}`);
          request.input(key, parameters[key]);
        });
      }
      
      const result = await request.query(query);
      const duration = Date.now() - startTime;
      
      this.logger.log(`Consulta ejecutada en ${duration}ms, ${result.recordset.length} registros`);
      return result.recordset;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Error en consulta después de ${duration}ms:`, error.message);
      throw error;
    }
  }

  // Método específico para consultas ICS con timeout optimizado
  async executeICSQuery(query: string, parameters?: any): Promise<any[]> {
    const startTime = Date.now();
    try {
      const pool = await this.getConnection();
      const request = pool.request();
      
      // Timeout específico para consultas ICS (30 segundos)
      request.timeout = 30000;
      
      // Agregar parámetros si existen
      if (parameters) {
        Object.keys(parameters).forEach(key => {
          this.logger.log(`[ICS] Agregando parámetro: ${key} = ${parameters[key]}`);
          request.input(key, parameters[key]);
        });
      }
      
      this.logger.log('[ICS] Ejecutando consulta optimizada...');
      const result = await request.query(query);
      const duration = Date.now() - startTime;
      
      this.logger.log(`[ICS] Consulta ejecutada en ${duration}ms, ${result.recordset.length} registros`);
      
      if (duration > 10000) {
        this.logger.warn(`[ICS] Consulta lenta detectada: ${duration}ms`);
      }
      
      return result.recordset;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`[ICS] Error en consulta después de ${duration}ms:`, error.message);
      
      if (error.message.includes('timeout')) {
        this.logger.error('[ICS] Timeout en consulta - considerar optimización adicional');
      }
      
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pool && this.pool.connected) {
      try {
        await this.pool.close();
        this.logger.log('Conexión a base de datos cerrada');
      } catch (error) {
        this.logger.error('Error al cerrar conexión:', error.message);
      }
    }
  }
}