export interface GlossaryEntry {
  term: string;
  localName: string;
  definition: string;
  example: string;
}

export const GLOSSARY_REYNOSA: GlossaryEntry[] = [
  { term: 'Escrow', localName: 'Depósito Garantía', definition: 'Fondo retenido por Stripe hasta que confirmas la entrega del servicio. Si hay problema, te devuelven tu dinero.', example: 'Tu pago de $850 queda en Escrow hasta que firmes conformidad.' },
  { term: 'Deep-Vetting', localName: 'Verificación Profunda', definition: 'Proceso de validación del técnico: INE + biometría + verificación domiciliaria presencial.', example: 'Todos los técnicos pasan por Deep-Vetting antes de aparecer en la plataforma.' },
  { term: 'PIN de Conformidad', localName: 'Código de Aceptación', definition: 'Código numérico que el cliente entrega al técnico al terminar el servicio. Libera los fondos del Escrow.', example: 'Al terminar, el técnico te da tu PIN: ingrésalo para liberar el pago.' },
  { term: 'Protocolo Antifuga', localName: 'Seguridad de Pago', definition: 'Mecanismo que asegura que el pago solo se libera con PIN correcto o firma del cliente.', example: 'Sin tu PIN, el técnico no recibe el pago aunque haya terminado.' },
  { term: 'Distinctivo Dorado', localName: 'Técnico Certificado', definition: 'Insignia que obtienen los técnicos con 10+ servicios consecutivos de 5 estrellas.', example: 'Roberto tiene el Distintivo Dorado por 15 servicios perfectos.' },
  { term: 'Tabulador Bimonetario', localName: 'Precios en Pesos y Dólares', definition: 'Todos los precios se muestran en MXN y USD al tipo de cambio del día.', example: 'El servicio de plomería cuesta $850 MXN (~$47 USD).' },
  { term: 'Colonia', localName: 'Barrio / Zona', definition: 'Zona geográfica de Reynosa. Selecciona tu colonia para encontrar técnicos cercanos.', example: 'Vivo en Las Fuentes, selecciono esa colonia al solicitar.' },
  { term: 'CFDI', localName: 'Factura Electrónica', definition: 'Comprobante Fiscal Digital por Internet. Factura oficial del SAT.', example: 'Puedes descargar tu CFDI después de cada servicio pagado.' },
];
