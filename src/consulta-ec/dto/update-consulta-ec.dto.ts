export class DetalleMoraDto {
  year: string;
  impuesto: string; // Formateado como moneda (L)
  trenDeAseo: string; // Formateado como moneda (L)
  tasaBomberos: string; // Formateado como moneda (L)
  recargo: string; // Formateado como moneda (L)
  total: string; // Formateado como moneda (L)
  dias: number;

  // Valores numéricos para cálculos internos
  impuestoNumerico: number;
  trenDeAseoNumerico: number;
  tasaBomberosNumerico: number;
  recargoNumerico: number;
  totalNumerico: number;
  
  // Campo para indicar si se aplicó amnistía a este año
  amnistiaAplicada?: boolean;
}

export class PropiedadDto {
  claveCatastral: string;
  colonia: string;
  nombreColonia: string;
  detallesMora: DetalleMoraDto[];
  totalPropiedad: string; // Total formateado para esta propiedad
  totalPropiedadNumerico: number; // Total numérico para esta propiedad
}

export class ConsultaECResponseDto {
  nombre: string;
  identidad: string;
  fecha: string;
  hora: string;
  
  // Para consultas por clave catastral (respuesta individual)
  claveCatastral?: string;
  colonia?: string;
  nombreColonia?: string;
  detallesMora?: DetalleMoraDto[];
  
  // Para consultas por DNI (respuesta agrupada)
  propiedades?: PropiedadDto[];
  
  // Totales generales
  totalGeneral: string; // Formateado como moneda (L)
  totalGeneralNumerico: number; // Valor numérico para cálculos
  
  // Campos para la amnistía tributaria
  amnistiaVigente?: boolean;
  fechaFinAmnistia?: string | null;
  
  // Campos adicionales
  codigoUmaps?: number;
  ruta?: string;
  
  // Indicador del tipo de consulta
  tipoConsulta: 'clave_catastral' | 'dni';
}
