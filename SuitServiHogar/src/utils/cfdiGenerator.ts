// Generador de CFDI 4.0 XML
// Compatible con SAT - Complemento Traslado para servicios

import { CFDIData, CFDIResult, CFDI_CONFIG, formatCFDIDate, generateUUID, calculateIVA } from '../services/cfdi';

/**
 * Genera la cadena original 4.0 para el sello
 * Formato según Anexo 20 SAT
 */
function generateCadenaOriginal40(data: any): string {
  const parts: string[] = [];
  
  // Comprobante
  parts.push(`||${data.version}|${data.serie}|${data.folio}|${data.fecha}|${data.formaPago}|${data.metodoPago}|${data.moneda}|${data.tipoCambio || ''}|${data.tipoComprobante}|${data.exportacion}|${data.condicionesDePago || ''}|${data.subTotal}|${data.descuento || ''}|${data.moneda}|${data.total}|${data.tipoComprobante}|${data.exportacion}|`);
  
  // Emisor
  parts.push(`|${data.emisor.rfc}|${data.emisor.nombre}|${data.emisor.regimenFiscal}|${data.emisor.codigoPostal}|`);
  
  // Receptor
  parts.push(`|${data.receptor.rfc}|${data.receptor.nombre}|${data.receptor.regimenFiscalReceptor}|${data.receptor.codigoPostal}|${data.receptor.usoCFDI}|`);
  
  // Conceptos
  for (const c of data.conceptos) {
    parts.push(`|${c.claveProdServ}|${c.claveUnidad}|${c.descripcion}|${c.cantidad}|${c.valorUnitario}|${c.importe}|${c.objetoImp}|`);
    if (c.impuestos?.traslados) {
      for (const t of c.impuestos.traslados) {
        parts.push(`|${t.base}|${t.impuesto}|${t.tipoFactor}|${t.tasaOCuota}|${t.importe}|`);
      }
    }
  }
  
  // Impuestos
  if (data.totalImpuestosTrasladados) {
    parts.push(`|${data.totalImpuestosTrasladados}|`);
  }
  
  // Complemento Traslado
  if (data.complementoTraslado) {
    const ct = data.complementoTraslado;
    parts.push(`|${ct.version}|${ct.origen.rfc}|${ct.origen.nombre}|${ct.origen.direccion.calle}|${ct.origen.direccion.noExterior}|${ct.origen.direccion.colonia}|${ct.origen.direccion.municipio}|${ct.origen.direccion.estado}|${ct.origen.direccion.pais}|${ct.origen.direccion.codigoPostal}|`);
    parts.push(`|${ct.destino.rfc}|${ct.destino.nombre}|${ct.destino.direccion.calle}|${ct.destino.direccion.noExterior}|${ct.destino.direccion.colonia}|${ct.destino.direccion.municipio}|${ct.destino.direccion.estado}|${ct.destino.direccion.pais}|${ct.destino.direccion.codigoPostal}|`);
    parts.push(`|${ct.distancia}|${ct.fechaHoraSalida}|${ct.fechaHoraLlegada}|`);
  }
  
  return parts.join('');
}

/**
 * Genera XML CFDI 4.0 sin firmar (para enviar a PAC)
 */
export function generateCFDIXML(data: any): string {
  const ns = {
    cfdi: 'http://www.sat.gob.mx/cfd/4',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    traslado: 'http://www.sat.gob.mx/traslado',
    xsiSchema: 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/traslado http://www.sat.gob.mx/sitio_internet/cfd/traslado/traslado10.xsd',
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<cfdi:Comprobante xmlns:cfdi="${ns.cfdi}" xmlns:xsi="${ns.xsi}" xmlns:traslado="${ns.traslado}" xsi:schemaLocation="${ns.xsiSchema}"`;
  
  // Atributos del comprobante
  const attrs = [
    `Version="4.0"`,
    `Serie="${data.serie || 'A'}"`,
    `Folio="${data.folio}"`,
    `Fecha="${data.fecha}"`,
    `FormaPago="${data.formaPago}"`,
    `MetodoPago="${data.metodoPago}"`,
    `Moneda="${data.moneda}"`,
    ...(data.tipoCambio ? [`TipoCambio="${data.tipoCambio}"`] : []),
    `TipoComprobante="${data.tipoComprobante}"`,
    `Exportacion="${data.exportacion}"`,
    ...(data.condicionesDePago ? [`CondicionesDePago="${data.condicionesDePago}"`] : []),
    `SubTotal="${data.subTotal.toFixed(2)}"`,
    ...(data.descuento ? [`Descuento="${data.descuento.toFixed(2)}"`] : []),
    `Moneda="${data.moneda}"`,
    `Total="${data.total.toFixed(2)}"`,
    `TipoComprobante="${data.tipoComprobante}"`,
    `Exportacion="${data.exportacion}"`,
  ];
  
  xml += ' ' + attrs.join(' ') + '>';
  
  // cfdi:Emisor
  xml += `<cfdi:Emisor Rfc="${data.emisor.rfc}" Nombre="${escapeXML(data.emisor.nombre)}" RegimenFiscal="${data.emisor.regimenFiscal}" CodigoPostal="${data.emisor.codigoPostal}" />`;
  
  // cfdi:Receptor
  xml += `<cfdi:Receptor Rfc="${data.receptor.rfc}" Nombre="${escapeXML(data.receptor.nombre)}" RegimenFiscalReceptor="${data.receptor.regimenFiscalReceptor}" CodigoPostal="${data.receptor.codigoPostal}" UsoCFDI="${data.receptor.usoCFDI}" />`;
  
  // cfdi:Conceptos
  xml += '<cfdi:Conceptos>';
  for (const c of data.conceptos) {
    xml += `<cfdi:Concepto ClaveProdServ="${c.claveProdServ}" ClaveUnidad="${c.claveUnidad}" Descripcion="${escapeXML(c.descripcion)}" Cantidad="${c.cantidad}" ValorUnitario="${c.valorUnitario.toFixed(2)}" Importe="${c.importe.toFixed(2)}" ObjetoImp="${c.objetoImp}"`;
    
    if (c.impuestos?.traslados?.length) {
      xml += '>';
      xml += '<cfdi:Impuestos><cfdi:Traslados>';
      for (const t of c.impuestos.traslados) {
        xml += `<cfdi:Traslado Base="${t.base.toFixed(2)}" Impuesto="${t.impuesto}" TipoFactor="${t.tipoFactor}" TasaOCuota="${t.tasaOCuota.toFixed(6)}" Importe="${t.importe.toFixed(2)}" />`;
      }
      xml += '</cfdi:Traslados></cfdi:Impuestos>';
    } else {
      xml += ' />';
    }
    xml += '</cfdi:Concepto>';
  }
  xml += '</cfdi:Conceptos>';
  
  // cfdi:Impuestos (total)
  if (data.totalImpuestosTrasladados) {
    xml += '<cfdi:Impuestos>';
    xml += `<cfdi:Traslados><cfdi:Traslado Base="${data.subTotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${data.totalImpuestosTrasladados.toFixed(2)}" /></cfdi:Traslados>`;
    xml += '</cfdi:Impuestos>';
  }
  
  // Complemento Traslado
  if (data.complementoTraslado) {
    const ct = data.complementoTraslado;
    xml += `<cfdi:Complemento><traslado:Traslado Version="${ct.version || '1.0'}"`;
    xml += `>`;
    
    // Origen
    xml += `<traslado:Origen Rfc="${ct.origen.rfc}" Nombre="${escapeXML(ct.origen.nombre)}">`;
    xml += `<traslado:Direccion Calle="${escapeXML(ct.origen.direccion.calle)}" NoExterior="${escapeXML(ct.origen.direccion.noExterior)}" Colonia="${escapeXML(ct.origen.direccion.colonia)}" Municipio="${escapeXML(ct.origen.direccion.municipio)}" Estado="${escapeXML(ct.origen.direccion.estado)}" Pais="${escapeXML(ct.origen.direccion.pais)}" CodigoPostal="${ct.origen.direccion.codigoPostal}" />`;
    xml += `</traslado:Origen>`;
    
    // Destino
    xml += `<traslado:Destino Rfc="${ct.destino.rfc}" Nombre="${escapeXML(ct.destino.nombre)}">`;
    xml += `<traslado:Direccion Calle="${escapeXML(ct.destino.direccion.calle)}" NoExterior="${escapeXML(ct.destino.direccion.noExterior)}" Colonia="${escapeXML(ct.destino.direccion.colonia)}" Municipio="${escapeXML(ct.destino.direccion.municipio)}" Estado="${escapeXML(ct.destino.direccion.estado)}" Pais="${escapeXML(ct.destino.direccion.pais)}" CodigoPostal="${ct.destino.direccion.codigoPostal}" />`;
    xml += `</traslado:Destino>`;
    
    // Distancia y fechas
    xml += `<traslado:Distancia>${ct.distancia}</traslado:Distancia>`;
    xml += `<traslado:FechaHoraSalida>${ct.fechaHoraSalida}</traslado:FechaHoraSalida>`;
    xml += `<traslado:FechaHoraLlegada>${ct.fechaHoraLlegada}</traslado:FechaHoraLlegada>`;
    
    xml += `</traslado:Traslado></cfdi:Complemento>`;
  }
  
  xml += '</cfdi:Comprobante>';
  
  return xml;
}

/**
 * Genera CFDI completo con timbrado mock (para desarrollo)
 * En producción: enviar XML a PAC para timbrado real
 */
export async function generateCFDI(data: any): Promise<any> {
  // 1. Validaciones básicas
  if (!data.emisor?.rfc || !data.receptor?.rfc) {
    throw new Error('RFC emisor y receptor son obligatorios');
  }
  
  // 2. Calcular totales si no vienen
  const subTotal = data.conceptos.reduce((sum: number, c: any) => sum + c.importe, 0);
  const totalImpuestos = data.conceptos.reduce((sum: number, c: any) => {
    return sum + (c.impuestos?.traslados?.reduce((s: number, t: any) => s + t.importe, 0) || 0);
  }, 0);
  
  const finalData = {
    ...data,
    version: '4.0',
    serie: data.serie || 'A',
    folio: data.folio || Math.floor(Math.random() * 1000000),
    fecha: data.fecha || new Date().toISOString().replace(/\.\d{3}Z$/, ''),
    formaPago: data.formaPago || '28',
    metodoPago: data.metodoPago || 'PUE',
    moneda: data.moneda || 'MXN',
    tipoComprobante: data.tipoComprobante || 'I',
    exportacion: data.exportacion || '01',
    subTotal: data.subTotal || data.conceptos.reduce((s: number, c: any) => s + c.importe, 0),
    descuento: data.descuento || 0,
    total: data.total || (subTotal + totalImpuestos),
    totalImpuestosTrasladados: totalImpuestos,
    complementoTraslado: data.complementoTraslado || undefined,
  };
  
  // 2. Generar XML sin firmar
  const xmlSinFirmar = generateCFDIXML(finalData);
  
  // 3. Generar cadena original para sello
  const cadenaOriginal = generateCadenaOriginal40(finalData);
  
  // 4. Mock timbrado (en producción: enviar a PAC)
  const uuid = generateUUID();
  const fechaTimbrado = new Date().toISOString().replace(/\.\d{3}Z$/, '');
  const selloCFD = 'MOCK_SELLO_CFD_' + btoa(cadenaOriginal).substring(0, 40);
  const selloSAT = 'MOCK_SELLO_SAT_' + btoa(uuid).substring(0, 40);
  
  // 5. Insertar sello en XML
  const xmlFirmado = xmlSinFirmar.replace(
    'xsi:schemaLocation=',
    `Sello="${selloCFD}" NoCertificado="00001000000400002345" Certificado="MIIF...CERTIFICADO..." xsi:schemaLocation=`
  ).replace(
    '</cfdi:Comprobante>',
    `<cfdi:Complemento><tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1" UUID="${generateUUID()}" FechaTimbrado="${new Date().toISOString().replace(/\.\d{3}Z$/, '')}" SelloCFD="${selloCFD}" NoCertificadoSAT="00001000000400002345" SelloSAT="${selloSAT}" RfcProvCertif="PAC010101XXX" /></cfdi:Complemento></cfdi:Comprobante>`
  );
  
  // 5. QR Code data
  const qrData = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?&id=${generateUUID()}&re=${escapeXML(finalData.emisor.rfc)}&rr=${escapeXML(finalData.receptor.rfc)}&tt=${finalData.total.toFixed(2)}&fe=${finalData.fecha.replace('T', '%20')}`;
  
  return {
    xml: xmlFirmado,
    uuid: generateUUID(),
    fechaTimbrado: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
    selloCFD,
    selloSAT,
    cadenaOriginal: cadenaOriginal,
    qrCode: qrData,
  };
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function downloadCFDI(xml: string, filename: string) {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}