import { generateCFDI } from '../utils/cfdi';

// Tipos para CFDI 4.0
export interface CFDIData {
  // Emisor (la plataforma)
  emisor: {
    rfc: string;
    nombre: string;
    regimenFiscal: string;      // 601 - General de Ley Personas Morales
    codigoPostal: string;
  };
  
  // Receptor (cliente o técnico)
  receptor: {
    rfc: string;
    nombre: string;
    regimenFiscalReceptor: string;
    codigoPostal: string;
    usoCFDI: string;            // G01 - Gastos en general, etc.
  };
  
  // Conceptos
  conceptos: Array<{
    claveProdServ: string;      // 81111500 - Servicios profesionales
    claveUnidad: string;        // ACT - Actividad
    descripcion: string;
    cantidad: number;
    valorUnitario: number;
    importe: number;
    objetoImp: string;          // 02 - Exento
    impuestos?: {
      traslados?: Array<{
        base: number;
        impuesto: string;       // 002 - IVA
        tipoFactor: string;     // Tasa
        tasaOCuota: number;     // 0.16
        importe: number;
      }>;
      retenciones?: Array<{
        base: number;
        impuesto: string;
        tipoFactor: string;
        tasaOCuota: number;
        importe: number;
      }>;
    };
  }>;
  
  // Complemento Traslado (obligatorio para servicios)
  complementoTraslado?: {
    origen: {
      rfc: string;
      nombre: string;
      direccion: {
        calle: string;
        noExterior: string;
        colonia: string;
        municipio: string;
        estado: string;
        pais: string;
        codigoPostal: string;
      };
    };
    destino: {
      rfc: string;
      nombre: string;
      direccion: {
        calle: string;
        noExterior: string;
        colonia: string;
        municipio: string;
        estado: string;
        pais: string;
        codigoPostal: string;
      };
    };
    distancia: number;          // km
    fechaHoraSalida: string;    // ISO 8601
    fechaHoraLlegada: string;
  };
  
  // Datos generales
  serie?: string;               // A
  folio: number;
  fecha: string;                // ISO 8601
  formaPago: string;            // 28 - Tarjeta de crédito
  metodoPago: string;           // PUE - Pago en una sola exhibición
  moneda: string;               // MXN
  tipoCambio?: number;
  tipoComprobante: string;      // I - Ingreso
  exportacion: string;          // 01 - No aplica
  condicionesDePago?: string;
  subTotal: number;
  descuento?: number;
  total: number;
  totalImpuestosTrasladados?: number;
}

export interface CFDIResult {
  xml: string;                  // XML firmado
  uuid: string;                 // UUID del timbrado
  fechaTimbrado: string;        // Fecha timbrado PAC
  selloCFD: string;             // Sello del emisor
  selloSAT: string;             // Sello del SAT
  cadenaOriginal: string;       // Cadena original 4.0
  qrCode: string;               // Código QR
  pdfBase64?: string;           // PDF opcional
}

export interface CFDIResponse {
  success: boolean;
  cfdi?: CFDIResult;
  error?: string;
}

// Configuración CFDI
export const CFDI_CONFIG = {
  // Emisor por defecto (la plataforma)
  EMISOR: {
    rfc: 'SHO260915AB1',        // RFC de la plataforma
    nombre: 'ServiciosHogar Reynosa SA de CV',
    regimenFiscal: '601',       // General de Ley Personas Morales
    codigoPostal: '88720',      // Reynosa, Tamps.
  },
  
  // Catálogos SAT
  REGIMENES_FISCALES: {
    '601': 'General de Ley Personas Morales',
    '603': 'Personas Morales con Fines no Lucrativos',
    '605': 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
    '606': 'Arrendamiento',
    '607': 'Régimen de Enajenación o Adquisición de Bienes',
    '608': 'Demás Ingresos',
    '610': 'Residentes en el Extranjero sin Establecimiento Permanente en México',
    '611': 'Ingresos por Dividendos',
    '612': 'Personas Físicas con Actividades Empresariales y Profesionales',
    '614': 'Ingresos por Intereses',
    '615': 'Régimen Opcional para Grupos de Sociedades',
    '616': 'Sin Obligaciones Fiscales',
    '620': 'Régimen Simplificado de Confianza (RESICO)',
    '621': 'Régimen Simplificado de Confianza (RESICO) - Personas Morales',
    '622': 'Régimen Simplificado de Confianza (RESICO) - Coordinados',
    '623': 'Régimen Simplificado de Confianza (RESICO) - Actividades Empresariales',
    '624': 'Régimen Simplificado de Confianza (RESICO) - Actividades Profesionales',
    '625': 'Régimen Simplificado de Confianza (RESICO) - Arrendamiento',
    '626': 'Régimen Simplificado de Confianza (RESICO) - Enajenación',
    '627': 'Régimen Simplificado de Confianza (RESICO) - Demás Ingresos',
    '628': 'Régimen Simplificado de Confianza (RESICO) - Dividendos',
    '629': 'Régimen Simplificado de Confianza (RESICO) - Intereses',
  },
  
  USOS_CFDI: {
    'G01': 'Gastos en general',
    'G02': 'Devoluciones, descuentos o bonificaciones',
    'G03': 'Gastos por devoluciones, descuentos o bonificaciones',
    'I01': 'Construcciones',
    'I02': 'Mobiliario y equipo de oficina por inversiones',
    'I03': 'Equipo de transporte',
    'I04': 'Equipo de cómputo y accesorios',
    'I05': 'Dados, troqueles, moldes, matrices y herramental',
    'I06': 'Comunicaciones telefónicas',
    'I07': 'Comunicaciones satelitales',
    'I08': 'Otra maquinaria y equipo',
    'D01': 'Honorarios médicos, dentales y gastos hospitalarios',
    'D02': 'Gastos médicos por incapacidad o discapacidad',
    'D03': 'Gastos funerales',
    'D04': 'Donativos',
    'D05': 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)',
    'D06': 'Aportaciones voluntarias al SAR',
    'D07': 'Primas por seguros de gastos médicos',
    'D08': 'Gastos de transporte escolar obligatorio',
    'D09': 'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones',
    'D10': 'Pagos por servicios educativos (colegiaturas)',
    'P01': 'Por definir',
  },
  
  CLAVES_PROD_SERV: {
    '81111500': 'Servicios profesionales, científicos y técnicos',
    '81111501': 'Servicios de contabilidad y auditoría',
    '81111502': 'Servicios de consultoría de gestión',
    '81111503': 'Servicios de arquitectura e ingeniería',
    '81111504': 'Servicios de diseño gráfico',
    '81111505': 'Servicios de publicidad',
    '81111506': 'Servicios de investigación de mercado',
    '81111507': 'Servicios de traducción e interpretación',
    '81111508': 'Servicios de fotografía y videografía',
    '81111509': 'Servicios de mantenimiento y reparación',
    '81111510': 'Servicios de limpieza',
    '81111511': 'Servicios de plomería',
    '81111512': 'Servicios de electricidad',
    '81111513': 'Servicios de HVAC',
    '81111514': 'Servicios de jardinería',
    '81111515': 'Servicios de pintura',
    '81111516': 'Servicios de carpintería',
    '81111517': 'Servicios de cerrajería',
    '81111517': 'Servicios de mudanza',
    '81111518': 'Servicios de fumigación',
  },
  
  FORMAS_PAGO: {
    '01': 'Efectivo',
    '02': 'Cheque nominativo',
    '03': 'Transferencia electrónica de fondos',
    '04': 'Tarjeta de crédito',
    '05': 'Monedero electrónico',
    '06': 'Dinero electrónico',
    '07': 'Vales de despensa',
    '08': 'Vales de restaurante',
    '09': 'Vales de gasolina',
    '10': 'Otros vales',
    '11': 'Otros',
    '28': 'Tarjeta de crédito (nueva 4.0)',
    '29': 'Tarjeta de débito (nueva 4.0)',
    '30': 'Tarjeta de servicios (nueva 4.0)',
    '99': 'Por definir',
  },
  
  METODOS_PAGO: {
    'PUE': 'Pago en una sola exhibición',
    'PPD': 'Pago en parcialidades o diferido',
  },
  
  MONEDAS: {
    'MXN': 'Peso Mexicano',
    'USD': 'Dólar Estadounidense',
    'EUR': 'Euro',
  },
  
  IMPUESTOS: {
    '002': 'IVA',
    '003': 'IEPS',
  },
  
  TIPOS_FACTOR: {
    'Tasa': 'Tasa',
    'Cuota': 'Cuota',
    'Exento': 'Exento',
  },
  
  OBJETO_IMP: {
    '01': 'Gravado',
    '02': 'Exento',
  },
  
  // Complemento Traslado
  COMPLEMENTO_TRASLADO: {
    VERSION: '1.0',
    TIPOS_FIGURA: {
      '01': 'Transportista',
      '02': 'Generador',
      '03': 'Destinatario',
    },
  },
} as const;

// Utilidades
export function formatCFDIDate(date: Date = new Date()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '').replace('T', 'T');
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function calculateIVA(base: number, tasa: number = 0.16): number {
  return Math.round(base * tasa * 100) / 100;
}

export function calculateRetencion(base: number, tasa: number): number {
  return Math.round(base * tasa * 100) / 100;
}