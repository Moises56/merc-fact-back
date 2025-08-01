export class DetalleMoraICSDto {
  year: string;
  impuesto: string; // Formateado como moneda (L)
  trenDeAseo: string; // Formateado como moneda (L)
  tasaBomberos: string; // Formateado como moneda (L)
  otros: string; // Formateado como moneda (L) - NUEVO CAMPO SIEMPRE VISIBLE
  recargo: string; // Formateado como moneda (L)
  total: string; // Formateado como moneda (L)
  dias: number;

  // Valores numéricos para cálculos internos
  impuestoNumerico: number;
  trenDeAseoNumerico: number;
  tasaBomberosNumerico: number;
  otrosNumerico: number; // NUEVO CAMPO NUMÉRICO
  recargoNumerico: number;
  totalNumerico: number;
  
  // Campo para indicar si se aplicó amnistía a este año
  amnistiaAplicada?: boolean;
}

export class PropiedadICSDto {
  numeroEmpresa: string; // NUM_DOCUMENTO (ej: ICS-107444)
  mes: string; // Mes de la obligación
  detallesMora: DetalleMoraICSDto[];
  totalPropiedad: string; // Total formateado para esta propiedad
  totalPropiedadNumerico: number; // Total numérico para esta propiedad
}

export class ConsultaICSResponseDto {
  nombre: string; // CONTRIBUYENTE
  identidad: string; // RTN_DNI
  fecha: string;
  hora: string;
  
  // Para consultas por ICS (respuesta individual)
  numeroEmpresa?: string;
  mes?: string;
  detallesMora?: DetalleMoraICSDto[];
  
  // Para consultas por DNI/RTN (respuesta agrupada)
  empresas?: PropiedadICSDto[];
  
  // Totales generales
  totalGeneral: string; // Formateado como moneda (L)
  totalGeneralNumerico: number; // Valor numérico para cálculos
  
  // Descuento de pronto pago
  descuentoProntoPago: string; // Formateado como moneda (L)
  descuentoProntoPagoNumerico: number; // Valor numérico del descuento
  totalAPagar: string; // Total después del descuento, formateado como moneda (L)
  totalAPagarNumerico: number; // Valor numérico del total a pagar
  
  // Campos para la amnistía tributaria
  amnistiaVigente?: boolean;
  fechaFinAmnistia?: string | null;
  
  // Campos adicionales
  codigoUmaps?: number;
  ruta?: string;
  
  // Indicador del tipo de consulta
  tipoConsulta: 'ics' | 'dni_rtn';
  
  // Campo para tracking de ubicación del usuario
  ubicacionConsulta?: string;
}