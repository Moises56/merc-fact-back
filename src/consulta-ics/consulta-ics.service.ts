import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { GetConsultaICSDto } from './dto/create-consulta-ics.dto';
import { ConsultaICSResponseDto, DetalleMoraICSDto, PropiedadICSDto } from './dto/update-consulta-ics.dto';
import { ReadonlyDatabaseService } from '../consulta-ec/readonly-database.service';

interface CacheEntryICS {
  data: any;
  timestamp: number;
}

@Injectable()
export class ConsultaIcsService {
  private readonly logger = new Logger(ConsultaIcsService.name);
  private readonly cacheICS = new Map<string, CacheEntryICS>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  constructor(private readonly readonlyDb: ReadonlyDatabaseService) {}

  async getConsultaICS(dto: GetConsultaICSDto): Promise<ConsultaICSResponseDto> {
    return this.buscarEstadoCuentaICS(dto, false);
  }

  async getConsultaICSAmnistia(dto: GetConsultaICSDto): Promise<ConsultaICSResponseDto> {
    return this.buscarEstadoCuentaICS(dto, true);
  }

  private async buscarEstadoCuentaICS(
    dto: GetConsultaICSDto,
    amnistia: boolean,
  ): Promise<ConsultaICSResponseDto> {
    try {
      // Log detallado con ubicación del usuario
      this.logger.log(
        `Consulta ICS ${amnistia ? 'con amnistía' : 'normal'} - Parámetros: ${JSON.stringify({
          ics: dto.ics,
          dni: dto.dni,
          ubicacion: dto.ubicacion || 'No especificada',
          timestamp: new Date().toISOString()
        })}`
      );

      // Generar clave de cache separada para ICS
      const cacheKey = `ics_${dto.ics || dto.dni}_${amnistia}`;
      
      // Verificar cache
      const cachedResult = this.getFromCacheICS(cacheKey);
      if (cachedResult) {
        this.logger.log(`Cache ICS hit para: ${cacheKey} - Ubicación: ${dto.ubicacion || 'No especificada'}`);
        return cachedResult;
      }

      this.logger.log(`Cache ICS miss para: ${cacheKey} - Ubicación: ${dto.ubicacion || 'No especificada'}`);

      // Construir consulta SQL para ICS
      const query = this.buildICSQuery();
      const params = {
        ics: dto.ics || null,
        dni: dto.dni || null,
      };

      // Ejecutar consulta
      const registros = await this.readonlyDb.executeQuery(query, params);

      if (!registros || registros.length === 0) {
        this.logger.warn(`No se encontraron registros ICS para: ${JSON.stringify(params)} - Ubicación: ${dto.ubicacion || 'No especificada'}`);
        throw new NotFoundException('No se encontraron registros para los parámetros proporcionados');
      }

      this.logger.log(`Registros ICS encontrados: ${registros.length} - Ubicación: ${dto.ubicacion || 'No especificada'}`);

      // Procesar registros según el tipo de consulta
      let resultado: ConsultaICSResponseDto;
      if (dto.ics) {
        resultado = this.procesarRegistrosPorICS(registros, amnistia, dto.ubicacion);
      } else {
        resultado = this.procesarRegistrosPorDNI(registros, amnistia, dto.ubicacion);
      }

      // Guardar en cache
      this.setCacheICS(cacheKey, resultado);
      this.cleanOldCacheICS();

      this.logger.log(`Consulta ICS completada exitosamente - Total: ${resultado.totalGeneral} - Ubicación: ${dto.ubicacion || 'No especificada'}`);
      return resultado;

    } catch (error) {
      this.logger.error(`Error en consulta ICS: ${error.message} - Ubicación: ${dto.ubicacion || 'No especificada'}`, error.stack);
      throw error;
    }
  }

  private buildICSQuery(): string {
    return `
      WITH ICS AS (
        SELECT 
          CONCAT(ACT.TXT_PRIMER_NOMBRE,' ',ACT.TXT_SEGUNDO_NOMBRE,' ',
                 ACT.TXT_PRIMER_APELLIDO,' ',ACT.TXT_SEGUNDO_APELLIDO) AS [CONTRIBUYENTE],
          ACT.TXT_IDENTIFICACION AS [RTN_DNI],
          OBL.TXT_NOMBRE AS [MES],
          ART.NUM_DOCUMENTO AS [NUMERO_DE_EMPRESA],
          MOV.BALANCE AS [SALDO],
          TM.TXT_NOMBRE AS [TIPO],
          OBL.ANIO AS [AÑO],
          DATEDIFF(DAY, OBL.FEC_VENCIMIENTO, GETDATE()) AS [DIAS_VENCIDOS]
        FROM 
          MI_ACTOR ACT WITH (NOLOCK)
          INNER JOIN MI_HISTORICO_ARTICULO HA WITH (NOLOCK) ON ACT.ID_ACTOR = HA.ID_ACTOR 
                     AND HA.SN_ACTIVO = 1
          INNER JOIN MI_ARTICULO ART WITH (NOLOCK) ON HA.ID_ARTICULO = ART.ID_ARTICULO 
                     AND ART.SN_ACTIVO = 1  
                     AND (@ics IS NULL OR ART.NUM_DOCUMENTO = @ics)
                     AND (@dni IS NULL OR ACT.TXT_IDENTIFICACION = @dni)
          INNER JOIN MI_FACTURABLE FAC WITH (NOLOCK) ON ART.ID_ARTICULO = FAC.ID_ARTICULO 
                     AND FAC.ID_PRODUCTO = 13
          INNER JOIN MI_OBLIGACION OBL WITH (NOLOCK) ON FAC.ID_FACTURABLE = OBL.ID_FACTURABLE 
                     AND OBL.ANIO >= 2015
          INNER JOIN MI_MOVIMIENTO MOV WITH (NOLOCK) ON OBL.ID_OBLIGACION = MOV.ID_OBLIGACION 
          INNER JOIN MI_TIPO_MOVIMIENTO TM WITH (NOLOCK) ON MOV.ID_TIPO_MOVIMIENTO = TM.ID_TIPO_MOVIMIENTO
          INNER JOIN MI_SUCURSAL_LICENCIA LB WITH (NOLOCK) ON ART.ID_ARTICULO = LB.ID_ARTICULO 
                     AND LB.SN_ACTIVO = 1
      ),
      PivotData AS (
        SELECT 
          [CONTRIBUYENTE],
          [RTN_DNI],
          [MES],
          [NUMERO_DE_EMPRESA],
          [AÑO],
          MAX([DIAS_VENCIDOS]) AS [DIAS_VENCIDOS],
          ISNULL([Impuesto], 0) AS [Impuesto],
          ISNULL([Tren de Aseo], 0) AS [Tren_de_Aseo],
          ISNULL([Tasa Bomberos], 0) AS [Tasa_Bomberos],
          ISNULL([Tasa de Medio Ambiente], 0) +
          ISNULL([Dictámenes], 0) +
          ISNULL([Tasa de Permiso de Operación], 0) +
          ISNULL([Multa], 0) +
          ISNULL([Ajuste por Ingresos], 0) +
          ISNULL([Tasa de Bares y Expendios], 0) +
          ISNULL([Impuesto Billar], 0) +
          ISNULL([Maquinas Tragamonedas], 0) +
          ISNULL([OTROS], 0) +
          ISNULL([Rótulos], 0) +
          SUM(ISNULL([Contrato], 0)) +
          SUM(ISNULL([Interes de Financiamiento], 0))
          AS [Otros]
        FROM 
          ICS
        PIVOT (
          SUM([SALDO])
          FOR [TIPO] IN (
            [Impuesto],
            [Tren de Aseo],
            [Tasa Bomberos],
            [Tasa de Medio Ambiente],
            [Dictámenes],
            [Tasa de Permiso de Operación],
            [Multa],
            [Ajuste por Ingresos],
            [Tasa de Bares y Expendios],
            [Impuesto Billar],
            [Maquinas Tragamonedas],
            [OTROS],
            [Contrato],
            [Interes de Financiamiento],
            [Rótulos]
          )
        ) AS PivotTable
        GROUP BY
          [CONTRIBUYENTE],
          [RTN_DNI],
          [MES],
          [NUMERO_DE_EMPRESA],
          [AÑO],
          [Impuesto],
          [Tren de Aseo], 
          [Tasa Bomberos],
          [Tasa de Medio Ambiente],
          [Dictámenes],
          [Tasa de Permiso de Operación],
          [Multa],
          [Ajuste por Ingresos],
          [Tasa de Bares y Expendios],
          [Impuesto Billar],
          [Maquinas Tragamonedas],
          [OTROS],
          [Contrato],
          [Interes de Financiamiento],
          [Rótulos]
      )
      SELECT 
        [CONTRIBUYENTE],
        [RTN_DNI],
        [MES],
        [NUMERO_DE_EMPRESA],
        [AÑO],
        [DIAS_VENCIDOS],
        [Impuesto],
        [Tren_de_Aseo],
        [Tasa_Bomberos],
        [Otros]
      FROM 
        PivotData
      ORDER BY
        [DIAS_VENCIDOS] DESC
    `;
  }

  private procesarRegistrosPorICS(registros: any[], amnistia: boolean, ubicacion?: string): ConsultaICSResponseDto {
    const primerRegistro = registros[0];
    
    this.logger.log(`Procesando ${registros.length} registros por ICS - Ubicación: ${ubicacion || 'No especificada'}`);

    // Agrupar por año
    const registrosPorAnio = new Map<string, any[]>();
    registros.forEach(registro => {
      const year = registro.AÑO.toString();
      if (!registrosPorAnio.has(year)) {
        registrosPorAnio.set(year, []);
      }
      registrosPorAnio.get(year)!.push(registro);
    });

    const detallesMora: DetalleMoraICSDto[] = [];
    let totalGeneralNumerico = 0;

    // Procesar cada año
    for (const [year, registrosAnio] of registrosPorAnio) {
      // Sumar todos los registros del año
      let impuestoNumerico = 0;
      let trenDeAseoNumerico = 0;
      let tasaBomberosNumerico = 0;
      let otrosNumerico = 0;
      let recargoNumerico = 0;
      
      // Calcular recargo mes por mes y sumar
      registrosAnio.forEach(registro => {
        const impuestoMes = parseFloat(registro.Impuesto) || 0;
        const trenDeAseoMes = parseFloat(registro.Tren_de_Aseo) || 0;
        const tasaBomberosMes = parseFloat(registro.Tasa_Bomberos) || 0;
        const otrosMes = parseFloat(registro.Otros) || 0;
        
        // Sumar los montos del mes
        impuestoNumerico += impuestoMes;
        trenDeAseoNumerico += trenDeAseoMes;
        tasaBomberosNumerico += tasaBomberosMes;
        otrosNumerico += otrosMes;
        
        // Calcular recargo para este mes específico
        const subtotalMes = impuestoMes + trenDeAseoMes + tasaBomberosMes + otrosMes;
        // Durante amnistía, solo el año 2025 tiene recargo
        if (amnistia && parseInt(year) < 2025) {
          // No hay recargo para años anteriores al 2025 durante amnistía
          const recargoMes = 0;
          recargoNumerico += recargoMes;
        } else {
          // Usar los días vencidos reales del registro, pero solo si son positivos
          const diasVencidosMes = Math.max(0, registro.DIAS_VENCIDOS);
          const recargoMes = this.calcularRecargo(subtotalMes, diasVencidosMes);
          recargoNumerico += recargoMes;
        }
      });
      
      const subtotal = impuestoNumerico + trenDeAseoNumerico + tasaBomberosNumerico + otrosNumerico;
      const totalNumerico = subtotal + recargoNumerico;
      
      // Usar el primer registro para obtener datos de referencia
      const registroReferencia = registrosAnio[0];
      const diasVencidos = amnistia ? this.calcularDiasVencidosConAmnistiaICS(year) : registroReferencia.DIAS_VENCIDOS;
      
      const detalle: DetalleMoraICSDto = {
        year,
        impuesto: this.formatearMoneda(impuestoNumerico),
        trenDeAseo: this.formatearMoneda(trenDeAseoNumerico),
        tasaBomberos: this.formatearMoneda(tasaBomberosNumerico),
        otros: this.formatearMoneda(otrosNumerico),
        recargo: this.formatearMoneda(recargoNumerico),
        total: this.formatearMoneda(totalNumerico),
        dias: diasVencidos,
        impuestoNumerico,
        trenDeAseoNumerico,
        tasaBomberosNumerico,
        otrosNumerico,
        recargoNumerico,
        totalNumerico,
        amnistiaAplicada: amnistia && diasVencidos !== registroReferencia.DIAS_VENCIDOS
      };
      
      detallesMora.push(detalle);
      totalGeneralNumerico += totalNumerico;
    }

    return {
      nombre: primerRegistro.CONTRIBUYENTE,
      identidad: primerRegistro.RTN_DNI,
      fecha: this.getFechaActual(),
      hora: this.getHoraActual(),
      numeroEmpresa: primerRegistro.NUMERO_DE_EMPRESA,
      mes: primerRegistro.MES,
      detallesMora,
      totalGeneral: this.formatearMoneda(totalGeneralNumerico),
      totalGeneralNumerico,
      amnistiaVigente: amnistia,
      fechaFinAmnistia: amnistia ? '30/09/2025' : null,
      tipoConsulta: 'ics',
      ubicacionConsulta: ubicacion
    };
  }

  private procesarRegistrosPorDNI(registros: any[], amnistia: boolean, ubicacion?: string): ConsultaICSResponseDto {
    const primerRegistro = registros[0];
    
    this.logger.log(`Procesando ${registros.length} registros por DNI/RTN - Ubicación: ${ubicacion || 'No especificada'}`);

    // Agrupar por empresa
    const registrosPorEmpresa = new Map<string, any[]>();
    registros.forEach(registro => {
      const empresa = registro.NUMERO_DE_EMPRESA;
      if (!registrosPorEmpresa.has(empresa)) {
        registrosPorEmpresa.set(empresa, []);
      }
      registrosPorEmpresa.get(empresa)!.push(registro);
    });

    const empresas: PropiedadICSDto[] = [];
    let totalGeneralNumerico = 0;

    // Procesar cada empresa
    for (const [numeroEmpresa, registrosEmpresa] of registrosPorEmpresa) {
      // Agrupar por año dentro de cada empresa
      const registrosPorAnio = new Map<string, any[]>();
      registrosEmpresa.forEach(registro => {
        const year = registro.AÑO.toString();
        if (!registrosPorAnio.has(year)) {
          registrosPorAnio.set(year, []);
        }
        registrosPorAnio.get(year)!.push(registro);
      });

      const detallesMora: DetalleMoraICSDto[] = [];
      let totalEmpresaNumerico = 0;

      // Procesar cada año de la empresa
      for (const [year, registrosAnio] of registrosPorAnio) {
        // Sumar todos los registros del año
        let impuestoNumerico = 0;
        let trenDeAseoNumerico = 0;
        let tasaBomberosNumerico = 0;
        let otrosNumerico = 0;
        let recargoNumerico = 0;
        
        // Calcular recargo mes por mes y sumar
        registrosAnio.forEach(registro => {
          const impuestoMes = parseFloat(registro.Impuesto) || 0;
          const trenDeAseoMes = parseFloat(registro.Tren_de_Aseo) || 0;
          const tasaBomberosMes = parseFloat(registro.Tasa_Bomberos) || 0;
          const otrosMes = parseFloat(registro.Otros) || 0;
          
          // Sumar los montos del mes
          impuestoNumerico += impuestoMes;
          trenDeAseoNumerico += trenDeAseoMes;
          tasaBomberosNumerico += tasaBomberosMes;
          otrosNumerico += otrosMes;
          
          // Calcular recargo para este mes específico
          const subtotalMes = impuestoMes + trenDeAseoMes + tasaBomberosMes + otrosMes;
          // Durante amnistía, solo el año 2025 tiene recargo
          if (amnistia && parseInt(year) < 2025) {
            // No hay recargo para años anteriores al 2025 durante amnistía
            const recargoMes = 0;
            recargoNumerico += recargoMes;
          } else {
            // Usar los días vencidos reales del registro, pero solo si son positivos
            const diasVencidosMes = Math.max(0, registro.DIAS_VENCIDOS);
            const recargoMes = this.calcularRecargo(subtotalMes, diasVencidosMes);
            recargoNumerico += recargoMes;
          }
        });
        
        const subtotal = impuestoNumerico + trenDeAseoNumerico + tasaBomberosNumerico + otrosNumerico;
        const totalNumerico = subtotal + recargoNumerico;
        
        // Usar el primer registro para obtener datos de referencia
        const registroReferencia = registrosAnio[0];
        const diasVencidos = amnistia ? this.calcularDiasVencidosConAmnistiaICS(year) : registroReferencia.DIAS_VENCIDOS;
        
        const detalle: DetalleMoraICSDto = {
          year,
          impuesto: this.formatearMoneda(impuestoNumerico),
          trenDeAseo: this.formatearMoneda(trenDeAseoNumerico),
          tasaBomberos: this.formatearMoneda(tasaBomberosNumerico),
          otros: this.formatearMoneda(otrosNumerico), // SIEMPRE VISIBLE
          recargo: this.formatearMoneda(recargoNumerico),
          total: this.formatearMoneda(totalNumerico),
          dias: diasVencidos,
          impuestoNumerico,
          trenDeAseoNumerico,
          tasaBomberosNumerico,
          otrosNumerico, // NUEVO CAMPO NUMÉRICO
          recargoNumerico,
          totalNumerico,
          amnistiaAplicada: amnistia && diasVencidos !== registroReferencia.DIAS_VENCIDOS
        };
        
        detallesMora.push(detalle);
        totalEmpresaNumerico += totalNumerico;
      }

      const empresa: PropiedadICSDto = {
        numeroEmpresa,
        mes: registrosEmpresa[0].MES,
        detallesMora,
        totalPropiedad: this.formatearMoneda(totalEmpresaNumerico),
        totalPropiedadNumerico: totalEmpresaNumerico
      };
      
      empresas.push(empresa);
      totalGeneralNumerico += totalEmpresaNumerico;
    }

    return {
      nombre: primerRegistro.CONTRIBUYENTE,
      identidad: primerRegistro.RTN_DNI,
      fecha: this.getFechaActual(),
      hora: this.getHoraActual(),
      empresas,
      totalGeneral: this.formatearMoneda(totalGeneralNumerico),
      totalGeneralNumerico,
      amnistiaVigente: amnistia,
      fechaFinAmnistia: amnistia ? '30/09/2025' : null,
      tipoConsulta: 'dni_rtn',
      ubicacionConsulta: ubicacion
    };
  }

  private calcularRecargo(monto: number, dias: number): number {
    if (dias <= 0 || monto <= 0) return 0;
    
    // Fórmula de recargo: [(Impuesto + Tren Aseo + Bomberos + Otros) × 0.22 × Días] ÷ 360
    return (monto * 0.22 * dias) / 360;
  }

  private calcularDiasVencidosConAmnistiaICS(year: string): number {
    const fechaFinAmnistia = new Date('2025-09-30');
    const fechaActual = new Date();
    
    // Si estamos después de la amnistía, usar fecha fin de amnistía
    const fechaCalculo = fechaActual > fechaFinAmnistia ? fechaFinAmnistia : fechaActual;
    
    // Para años 2016-2025, calcular días hasta la fecha de cálculo
    const yearNum = parseInt(year);
    if (yearNum >= 2016 && yearNum <= 2025) {
      // Si es 2025, solo contar hasta el mes actual o hasta septiembre (amnistía)
      if (yearNum === 2025) {
        const mesActual = fechaCalculo.getMonth() + 1; // getMonth() es 0-based
        const diasTranscurridos = Math.min(mesActual, 9) * 30; // Máximo hasta septiembre
        return Math.max(0, diasTranscurridos);
      }
      
      // Para años anteriores a 2025, calcular días completos hasta la fecha de cálculo
      const fechaVencimiento = new Date(`${year}-12-31`);
      const diffTime = fechaCalculo.getTime() - fechaVencimiento.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    return 0;
  }

  private formatearMoneda(valor: number): string {
    return `L ${valor.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private getFechaActual(): string {
    const fecha = new Date();
    return fecha.toLocaleDateString('es-HN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  private getHoraActual(): string {
    const fecha = new Date();
    return fecha.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Métodos de cache separados para ICS
  private getFromCacheICS(key: string): ConsultaICSResponseDto | null {
    const entry = this.cacheICS.get(key);
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp < this.CACHE_TTL) {
        return entry.data;
      } else {
        this.cacheICS.delete(key);
      }
    }
    return null;
  }

  private setCacheICS(key: string, data: ConsultaICSResponseDto): void {
    this.cacheICS.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private cleanOldCacheICS(): void {
    const now = Date.now();
    for (const [key, entry] of this.cacheICS.entries()) {
      if (now - entry.timestamp >= this.CACHE_TTL) {
        this.cacheICS.delete(key);
      }
    }
  }
}