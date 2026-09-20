// Server-side CFDI 4.0 Generator (CommonJS for server.js)
const crypto = require('crypto');

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

function generateCFDIXML(data) {
  const ns = {
    cfdi: 'http://www.sat.gob.mx/cfd/4',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    traslado: 'http://www.sat.gob.mx/traslado',
    xsiSchema: 'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/traslado http://www.sat.gob.mx/sitio_internet/cfd/traslado/traslado10.xsd',
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
  xml += `<cfdi:Comprobante xmlns:cfdi="${ns.cfdi}" xmlns:xsi="${ns.xsi}" xmlns:traslado="${ns.traslado}" xsi:schemaLocation="${ns.xsiSchema}"`;
  
  const attrs = [
    `Version="4.0"`,
    `Serie="${data.serie || 'A'}"`,
    `Folio="${data.folio}"`,
    `Fecha="${data.fecha}"`,
    `FormaPago="${data.formaPago}"`,
    `MetodoPago="${data.metodoPago}"`,
    `Moneda="${data.moneda}"`,
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
  
  // Emisor
  xml += `<cfdi:Emisor Rfc="${data.emisor.rfc}" Nombre="${escapeXML(data.emisor.nombre)}" RegimenFiscal="${data.emisor.regimenFiscal}" CodigoPostal="${data.emisor.codigoPostal}" />`;
  
  // Receptor
  xml += `<cfdi:Receptor Rfc="${data.receptor.rfc}" Nombre="${escapeXML(data.receptor.nombre)}" RegimenFiscalReceptor="${data.receptor.regimenFiscalReceptor}" CodigoPostal="${data.receptor.codigoPostal}" UsoCFDI="${data.receptor.usoCFDI}" />`;
  
  // Conceptos
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
  
  // Impuestos total
  if (data.totalImpuestosTrasladados) {
    xml += '<cfdi:Impuestos>';
    xml += `<cfdi:Traslados><cfdi:Traslado Base="${data.subTotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${data.totalImpuestosTrasladados.toFixed(2)}" /></cfdi:Traslados>`;
    xml += '</cfdi:Impuestos>';
  }
  
  // Complemento Traslado
  if (data.complementoTraslado) {
    const ct = data.complementoTraslado;
    xml += `<cfdi:Complemento><traslado:Traslado Version="${ct.version || '1.0'}">`;
    
    xml += `<traslado:Origen Rfc="${ct.origen.rfc}" Nombre="${escapeXML(ct.origen.nombre)}">`;
    xml += `<traslado:Direccion Calle="${escapeXML(ct.origen.direccion.calle)}" NoExterior="${escapeXML(ct.origen.direccion.noExterior)}" Colonia="${escapeXML(ct.origen.direccion.colonia)}" Municipio="${escapeXML(ct.origen.direccion.municipio)}" Estado="${escapeXML(ct.origen.direccion.estado)}" Pais="${escapeXML(ct.origen.direccion.pais)}" CodigoPostal="${ct.origen.direccion.codigoPostal}" />`;
    xml += `</traslado:Origen>`;
    
    xml += `<traslado:Destino Rfc="${ct.destino.rfc}" Nombre="${escapeXML(ct.destino.nombre)}">`;
    xml += `<traslado:Direccion Calle="${escapeXML(ct.destino.direccion.calle)}" NoExterior="${escapeXML(ct.destino.direccion.noExterior)}" Colonia="${escapeXML(ct.destino.direccion.colonia)}" Municipio="${escapeXML(ct.destino.direccion.municipio)}" Estado="${escapeXML(ct.destino.direccion.estado)}" Pais="${escapeXML(ct.destino.direccion.pais)}" CodigoPostal="${ct.destino.direccion.codigoPostal}" />`;
    xml += `</traslado:Destino>`;
    
    xml += `<traslado:Distancia>${ct.distancia}</traslado:Distancia>`;
    xml += `<traslado:FechaHoraSalida>${ct.fechaHoraSalida}</traslado:FechaHoraSalida>`;
    xml += `<traslado:FechaHoraLlegada>${ct.fechaHoraLlegada}</traslado:FechaHoraLlegada>`;
    
    xml += `</traslado:Traslado></cfdi:Complemento>`;
  }
  
  xml += '</cfdi:Comprobante>';
  return xml;
}

function escapeXML(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = { generateCFDIXML, escapeXML, generateUUID };