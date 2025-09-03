import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GetConsultaECDto } from './dto/create-consulta-ec.dto';
import {
  ConsultaECResponseDto,
  DetalleMoraDto,
  PropiedadDto,
} from './dto/update-consulta-ec.dto';
import { ReadonlyDatabaseService } from './readonly-database.service';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class ConsultaEcService {
  private readonly logger = new Logger(ConsultaEcService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutos

  constructor(private readonly readonlyDb: ReadonlyDatabaseService) {}

  async getConsultaEC(dto: GetConsultaECDto): Promise<ConsultaECResponseDto> {
    return this.buscarEstadoCuenta(dto, false);
  }

  async getConsultaECAmnistia(
    dto: GetConsultaECDto,
  ): Promise<ConsultaECResponseDto> {
    return this.buscarEstadoCuenta(dto, true);
  }

  private async buscarEstadoCuenta(
    dto: GetConsultaECDto,
    amnistia: boolean,
  ): Promise<ConsultaECResponseDto> {
    try {
      // Validar que se proporcione al menos un parámetro
      if (!dto.claveCatastral && !dto.dni) {
        throw new BadRequestException('Debe proporcionar claveCatastral o dni');
      }

      // Generar clave de cache
      const cacheKey = `${dto.claveCatastral || dto.dni}_${amnistia}`;

      // Verificar cache
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        this.logger.log(`Cache hit para: ${cacheKey}`);
        return cachedResult;
      }

      this.logger.log(`Cache miss para: ${cacheKey}`);

      // Construir consulta SQL
      const query = this.buildQuery();
      const parameters: any = {
        artIdDoc: dto.claveCatastral || null,
        actIdCard: dto.dni || null,
      };

      // Ejecutar consulta
      const registros = await this.readonlyDb.executeQuery(query, parameters);

      if (!registros || registros.length === 0) {
        throw new NotFoundException(
          'No se encontraron registros para los parámetros proporcionados',
        );
      }

      // Determinar tipo de consulta y procesar resultados
      const tipoConsulta = dto.claveCatastral ? 'clave_catastral' : 'dni';
      const resultado =
        tipoConsulta === 'clave_catastral'
          ? this.procesarRegistrosPorClaveCatastral(registros, amnistia)
          : this.procesarRegistrosPorDNI(registros, amnistia);

      // Guardar en cache
      this.setCache(cacheKey, resultado);

      return resultado;
    } catch (error) {
      this.logger.error(`Error en buscarEstadoCuenta: ${error.message}`);
      throw error;
    }
  }

  private buildQuery(): string {
    return `
      SELECT * FROM (
        SELECT 
          AR.NUM_DOCUMENTO AS ART_ID_DOC,
          A.TXT_IDENTIFICACION AS ACT_ID_CARD,
          CONCAT(A.TXT_PRIMER_NOMBRE, ' ', A.TXT_SEGUNDO_NOMBRE, ' ', A.TXT_PRIMER_APELLIDO, ' ', A.TXT_SEGUNDO_APELLIDO) AS NOMBRE,
          DV.ID_SECTOR AS SECTOR_COLONIA,
          DV.TXT_NOMBRE AS NOMBRE_COLONIA,
          O.ANIO AS OBL_YEAR, 
          CASE 
            WHEN O.FEC_VENCIMIENTO > GETDATE() THEN 0 
            ELSE DATEDIFF(DAY, O.FEC_VENCIMIENTO, GETDATE()) 
          END AS DIAS,
          TM.TXT_NOMBRE AS TIPO,
          SUM(M.BALANCE) AS VALOR
        FROM [AMDC].dbo.MI_ACTOR A 
          INNER JOIN [AMDC].dbo.MI_HISTORICO_ARTICULO HART ON HART.ID_ACTOR = A.ID_ACTOR
          INNER JOIN [AMDC].dbo.MI_ARTICULO AR ON AR.ID_ARTICULO = HART.ID_ARTICULO
          INNER JOIN [AMDC].dbo.MI_FACTURABLE I ON I.ID_ARTICULO = AR.ID_ARTICULO
          INNER JOIN [AMDC].dbo.MI_OBLIGACION O ON O.ID_FACTURABLE = I.ID_FACTURABLE 
          INNER JOIN [AMDC].dbo.MI_MOVIMIENTO M ON M.ID_OBLIGACION = O.ID_OBLIGACION
          INNER JOIN [AMDC].dbo.MI_TIPO_MOVIMIENTO TM ON TM.ID_TIPO_MOVIMIENTO = M.ID_TIPO_MOVIMIENTO
          INNER JOIN [AMDC].dbo.MI_BIEN_INMUEBLE BI ON BI.ID_ARTICULO = AR.ID_ARTICULO
          INNER JOIN [AMDC].dbo.MI_DIRECCION D ON D.ID_DIRECCION = BI.ID_DIRECCION
          LEFT JOIN [AMDC].dbo.MI_CODIGO_POSTAL CP ON CP.ID_CODIGO_POSTAL = D.ID_CODIGO_POSTAL
          INNER JOIN [AMDC].dbo.MI_DESARROLLO_VIVIENDA DV ON DV.ID_DESARROLLO_VIVIENDA = CP.ID_DESARROLLO_VIVIENDA
        WHERE 
          I.ID_PRODUCTO = 15
          AND O.ANIO BETWEEN 2015 AND 2025
          AND HART.SN_ACTIVO = 1
          AND (@artIdDoc IS NULL OR AR.NUM_DOCUMENTO = @artIdDoc)
          AND (@actIdCard IS NULL OR A.TXT_IDENTIFICACION = @actIdCard)
        GROUP BY 
          AR.NUM_DOCUMENTO, A.TXT_IDENTIFICACION, A.TXT_PRIMER_NOMBRE, A.TXT_SEGUNDO_NOMBRE, 
          A.TXT_PRIMER_APELLIDO, A.TXT_SEGUNDO_APELLIDO, 
          TM.TXT_NOMBRE, O.ANIO, O.FEC_VENCIMIENTO, DV.ID_SECTOR, DV.TXT_NOMBRE
      ) AS SourceData
      PIVOT (
        SUM(VALOR)
        FOR TIPO IN ([Impuesto], [Tren de Aseo], [Tasa Bomberos])
      ) AS PVT
      WHERE NOT ([Impuesto] IS NULL 
        AND [Tren de Aseo] IS NULL 
        AND [Tasa Bomberos] IS NULL)
      ORDER BY ART_ID_DOC, OBL_YEAR
    `;
  }

  private procesarRegistrosPorClaveCatastral(
    registros: any[],
    amnistia: boolean,
  ): ConsultaECResponseDto {
    const formatoMoneda = new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    });

    const detallesMora: DetalleMoraDto[] = [];

    for (const registro of registros) {
      const year = parseInt(registro.OBL_YEAR);
      const yearStr = year.toString();

      // Calcular días vencidos
      const dias = amnistia
        ? this.calcularDiasVencidosConAmnistia(yearStr)
        : registro.DIAS || 0;

      // Valores base
      const impuestoNumerico = parseFloat(registro.Impuesto) || 0;
      const trenDeAseoNumerico = parseFloat(registro['Tren de Aseo']) || 0;
      const tasaBomberosNumerico = parseFloat(registro['Tasa Bomberos']) || 0;

      // Calcular recargo: [(impuesto+trenAseo+bomberos)(diasVencidos)(22%)]/360
      const baseRecargo =
        impuestoNumerico + trenDeAseoNumerico + tasaBomberosNumerico;
      const recargoNumerico = (baseRecargo * dias * 0.22) / 360;

      const totalNumerico =
        impuestoNumerico +
        trenDeAseoNumerico +
        tasaBomberosNumerico +
        recargoNumerico;

      // Formatear valores
      const impuesto = formatoMoneda.format(impuestoNumerico);
      const trenDeAseo = formatoMoneda.format(trenDeAseoNumerico);
      const tasaBomberos = formatoMoneda.format(tasaBomberosNumerico);
      const recargo = formatoMoneda.format(recargoNumerico);
      const total = formatoMoneda.format(totalNumerico);

      detallesMora.push({
        year: yearStr,
        impuesto,
        trenDeAseo,
        tasaBomberos,
        recargo,
        total,
        dias,
        impuestoNumerico,
        trenDeAseoNumerico,
        tasaBomberosNumerico,
        recargoNumerico,
        totalNumerico,
        amnistiaAplicada:
          amnistia && (year < 2025 || (year === 2025 && dias === 0)),
      });
    }

    // Calcular total general
    const totalGeneralNumerico = detallesMora.reduce(
      (sum, detalle) => sum + detalle.totalNumerico,
      0,
    );
    const totalGeneral = formatoMoneda.format(totalGeneralNumerico);

    const primerRegistro = registros[0];

    return {
      nombre: primerRegistro?.NOMBRE || 'No disponible',
      identidad: primerRegistro?.ACT_ID_CARD || 'No disponible',
      claveCatastral: primerRegistro?.ART_ID_DOC || 'No disponible',
      fecha: this.getFechaActual(),
      hora: this.getHoraActual(),
      colonia: primerRegistro?.SECTOR_COLONIA || 'No disponible',
      nombreColonia: primerRegistro?.NOMBRE_COLONIA || 'No disponible',
      detallesMora,
      totalGeneral,
      totalGeneralNumerico,
      amnistiaVigente: amnistia,
      fechaFinAmnistia: amnistia ? '30/09/2025' : null,
      tipoConsulta: 'clave_catastral',
    };
  }

  private procesarRegistrosPorDNI(
    registros: any[],
    amnistia: boolean,
  ): ConsultaECResponseDto {
    const formatoMoneda = new Intl.NumberFormat('es-HN', {
      style: 'currency',
      currency: 'HNL',
      minimumFractionDigits: 2,
    });

    // Agrupar registros por clave catastral
    const registrosPorClave = new Map<string, any[]>();

    for (const registro of registros) {
      const claveCatastral = registro.ART_ID_DOC;
      if (!registrosPorClave.has(claveCatastral)) {
        registrosPorClave.set(claveCatastral, []);
      }
      registrosPorClave.get(claveCatastral)!.push(registro);
    }

    const propiedades: PropiedadDto[] = [];
    let totalGeneralNumerico = 0;

    // Procesar cada propiedad
    for (const [claveCatastral, registrosPropiedad] of registrosPorClave) {
      const detallesMora: DetalleMoraDto[] = [];
      let totalPropiedadNumerico = 0;

      for (const registro of registrosPropiedad) {
        const year = parseInt(registro.OBL_YEAR);
        const yearStr = year.toString();

        // Calcular días vencidos
        const dias = amnistia
          ? this.calcularDiasVencidosConAmnistia(yearStr)
          : registro.DIAS || 0;

        // Valores base
        const impuestoNumerico = parseFloat(registro.Impuesto) || 0;
        const trenDeAseoNumerico = parseFloat(registro['Tren de Aseo']) || 0;
        const tasaBomberosNumerico = parseFloat(registro['Tasa Bomberos']) || 0;

        // Calcular recargo: [(impuesto+trenAseo+bomberos)(diasVencidos)(22%)]/360
        const baseRecargo =
          impuestoNumerico + trenDeAseoNumerico + tasaBomberosNumerico;
        const recargoNumerico = (baseRecargo * dias * 0.22) / 360;

        const totalNumerico =
          impuestoNumerico +
          trenDeAseoNumerico +
          tasaBomberosNumerico +
          recargoNumerico;
        totalPropiedadNumerico += totalNumerico;

        // Formatear valores
        const impuesto = formatoMoneda.format(impuestoNumerico);
        const trenDeAseo = formatoMoneda.format(trenDeAseoNumerico);
        const tasaBomberos = formatoMoneda.format(tasaBomberosNumerico);
        const recargo = formatoMoneda.format(recargoNumerico);
        const total = formatoMoneda.format(totalNumerico);

        detallesMora.push({
          year: yearStr,
          impuesto,
          trenDeAseo,
          tasaBomberos,
          recargo,
          total,
          dias,
          impuestoNumerico,
          trenDeAseoNumerico,
          tasaBomberosNumerico,
          recargoNumerico,
          totalNumerico,
          amnistiaAplicada:
            amnistia && (year < 2025 || (year === 2025 && dias === 0)),
        });
      }

      // Ordenar detalles por año
      detallesMora.sort((a, b) => parseInt(a.year) - parseInt(b.year));

      const primerRegistroPropiedad = registrosPropiedad[0];
      propiedades.push({
        claveCatastral,
        colonia: primerRegistroPropiedad?.SECTOR_COLONIA || 'No disponible',
        nombreColonia:
          primerRegistroPropiedad?.NOMBRE_COLONIA || 'No disponible',
        detallesMora,
        totalPropiedad: formatoMoneda.format(totalPropiedadNumerico),
        totalPropiedadNumerico,
      });

      totalGeneralNumerico += totalPropiedadNumerico;
    }

    // Ordenar propiedades por clave catastral
    propiedades.sort((a, b) =>
      a.claveCatastral.localeCompare(b.claveCatastral),
    );

    const totalGeneral = formatoMoneda.format(totalGeneralNumerico);
    const primerRegistro = registros[0];

    return {
      nombre: primerRegistro?.NOMBRE || 'No disponible',
      identidad: primerRegistro?.ACT_ID_CARD || 'No disponible',
      fecha: this.getFechaActual(),
      hora: this.getHoraActual(),
      propiedades,
      totalGeneral,
      totalGeneralNumerico,
      amnistiaVigente: amnistia,
      fechaFinAmnistia: amnistia ? '30/09/2025' : null,
      tipoConsulta: 'dni',
    };
  }

  private calcularDiasVencidosConAmnistia(year: string): number {
    if (!year || !/^[0-9]{4}$/.test(year)) return 0;

    const fechaVencimiento = new Date(parseInt(year), 7, 31); // 31 de agosto
    fechaVencimiento.setHours(0, 0, 0, 0);

    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);

    const fechaFinAmnistia = new Date(2025, 8, 30); // 30 de septiembre 2025
    fechaFinAmnistia.setHours(0, 0, 0, 0);

    // Si estamos después de la fecha de fin de amnistía, calcular días normalmente
    if (fechaActual > fechaFinAmnistia) {
      if (fechaActual < fechaVencimiento) return 0;
      return Math.floor(
        (fechaActual.getTime() - fechaVencimiento.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    // Si la amnistía está vigente y el año es anterior a 2025, no hay días vencidos
    const yearNum = parseInt(year);
    if (yearNum < 2025) {
      return 0;
    }

    // Para el año 2025, solo calcular días si ya venció
    if (yearNum === 2025) {
      if (fechaActual < fechaVencimiento) return 0;
      return Math.floor(
        (fechaActual.getTime() - fechaVencimiento.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    return 0;
  }

  private getFechaActual(): string {
    const fechaActual = new Date();
    return fechaActual.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private getHoraActual(): string {
    const fechaActual = new Date();
    return fechaActual.toLocaleTimeString('es-HN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  private getFromCache(key: string): ConsultaECResponseDto | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: ConsultaECResponseDto): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Limpiar cache viejo periódicamente
    if (this.cache.size > 100) {
      this.cleanOldCache();
    }
  }

  private cleanOldCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}
