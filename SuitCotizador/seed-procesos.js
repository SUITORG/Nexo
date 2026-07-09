const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const procesosPorGiro = {
  'Alimentos': [
    { nombre: 'Paquete de Comida Ejecutiva', tipo: 'producto', precio: 149 },
    { nombre: 'Servicio de Catering para Eventos', tipo: 'servicio', precio: 3500 },
    { nombre: 'Paquete de Comida Familiar', tipo: 'producto', precio: 299 },
    { nombre: 'Servicio de Meseros para Evento', tipo: 'servicio', precio: 1500 },
    { nombre: 'Menú Personalizado por Suscripción', tipo: 'proceso', precio: 1200 }
  ],
  'Hospedaje': [
    { nombre: 'Habitación Estándar por Noche', tipo: 'producto', precio: 850 },
    { nombre: 'Habitación Premium con Vista', tipo: 'producto', precio: 1450 },
    { nombre: 'Limpieza y Mantenimiento de Habitación', tipo: 'servicio', precio: 350 },
    { nombre: 'Estancia Semanal con Descuento', tipo: 'proceso', precio: 5000 },
    { nombre: 'Paquete de Hospedaje + Servicios', tipo: 'proceso', precio: 2200 }
  ],
  'Lavandería': [
    { nombre: 'Lavado y Secado por Kilo', tipo: 'producto', precio: 45 },
    { nombre: 'Planchado por Prenda', tipo: 'servicio', precio: 25 },
    { nombre: 'Lavado en Seco (Traje/Vestido)', tipo: 'servicio', precio: 120 },
    { nombre: 'Paquete Semanal de Lavandería', tipo: 'proceso', precio: 350 },
    { nombre: 'Recogida y Entrega a Domicilio', tipo: 'servicio', precio: 80 }
  ],
  'Desarollo SaaS': [
    { nombre: 'Sitio Web Landing Page', tipo: 'producto', precio: 5000 },
    { nombre: 'Desarrollo de Sistema Web a Medida', tipo: 'servicio', precio: 25000 },
    { nombre: 'Mantenimiento Mensual de Sistema', tipo: 'servicio', precio: 2500 },
    { nombre: 'Consultoría de Arquitectura Software', tipo: 'servicio', precio: 3000 },
    { nombre: 'Migración de Datos a Supabase', tipo: 'proceso', precio: 8000 }
  ],
  'Marca Personal': [
    { nombre: 'Sesión de Fotografía Profesional', tipo: 'servicio', precio: 2500 },
    { nombre: 'Diseño de Marca Personal (Logo + Paleta)', tipo: 'producto', precio: 3500 },
    { nombre: 'Mentoría de Marca Personal 1 a 1', tipo: 'servicio', precio: 1500 },
    { nombre: 'Paquete de Branding Completo', tipo: 'proceso', precio: 8000 },
    { nombre: 'Video Reel Profesional para Redes', tipo: 'servicio', precio: 4500 }
  ],
  'Seguros': [
    { nombre: 'Póliza de Seguro de Auto Básico', tipo: 'producto', precio: 4500 },
    { nombre: 'Seguro de Vida Individual', tipo: 'producto', precio: 3200 },
    { nombre: 'Asesoría Patrimonial Personalizada', tipo: 'servicio', precio: 2000 },
    { nombre: 'Paquete de Seguros Empresarial', tipo: 'proceso', precio: 15000 },
    { nombre: 'Seguro de Gastos Médicos Mayores', tipo: 'producto', precio: 8500 }
  ],
  'Energía Solar': [
    { nombre: 'Panel Solar Monocristalino 450W', tipo: 'producto', precio: 3800 },
    { nombre: 'Instalación de Sistema Solar Residencial', tipo: 'servicio', precio: 25000 },
    { nombre: 'Mantenimiento Anual de Paneles Solares', tipo: 'servicio', precio: 2500 },
    { nombre: 'Sistema Solar Completo para Casa', tipo: 'proceso', precio: 45000 },
    { nombre: 'Diagnóstico y Cotización de Consumo Energético', tipo: 'servicio', precio: 500 }
  ],
  'Consultoría Patrimonial': [
    { nombre: 'Consulta de Planeación Patrimonial', tipo: 'servicio', precio: 2000 },
    { nombre: 'Análisis de Pensiones y Retiro (Modalidad 40)', tipo: 'servicio', precio: 3500 },
    { nombre: 'Paquete de Regularización ante el IMSS', tipo: 'proceso', precio: 6000 },
    { nombre: 'Asesoría Fiscal para Personas Físicas', tipo: 'servicio', precio: 2500 },
    { nombre: 'Plan de Ahorro e Inversión Personalizado', tipo: 'servicio', precio: 1800 }
  ],
  'Servicios': [
    { nombre: 'Servicio de Consultoría Técnica', tipo: 'servicio', precio: 2000 },
    { nombre: 'Mantenimiento de Equipos', tipo: 'servicio', precio: 800 },
    { nombre: 'Paquete de Servicios Mensuales', tipo: 'proceso', precio: 3500 },
    { nombre: 'Instalación de Sistemas', tipo: 'servicio', precio: 4000 },
    { nombre: 'Soporte Técnico Remoto', tipo: 'servicio', precio: 500 }
  ]
};

function getNextId(arr, prefix) {
  if (!arr || arr.length === 0) return prefix + '-001';
  const nums = arr.map(r => parseInt((r.id || '').split('-').pop()) || 0);
  const next = Math.max(...nums, 0) + 1;
  return prefix + '-' + String(next).padStart(3, '0');
}

async function main() {
  // 1. Get ALL empresas
  const { data: empresas, error } = await sb.from('Config_Empresas').select('*');
  if (error) { console.error('ERROR:', error.message); return; }

  console.log(`📊 ${empresas.length} empresas encontradas`);

  for (const emp of empresas) {
    const idEmpresa = emp.id_empresa;
    const tipoNegocio = emp.tipo_negocio || 'Servicios';
    const giroActual = emp.giro_especifico || '';

    // Determine the giro base (what comes before the comma)
    let giroBase;
    if (giroActual.includes(',')) {
      giroBase = giroActual.split(',')[0].trim();
    } else if (giroActual && giroActual.trim()) {
      giroBase = giroActual.trim();
    } else {
      giroBase = tipoNegocio;
    }

    // Check if already enabled
    const partes = giroActual ? giroActual.split(',') : [];
    const yaHabilitado = partes.length >= 2 && partes[partes.length - 1].trim() === '1';

    if (!yaHabilitado) {
      // Enable it by appending ,1
      const nuevoGiro = giroBase + ',1';
      console.log(`🔧 ${idEmpresa}: ${giroActual || '(vacío)'} → ${nuevoGiro}`);
      const { error: updErr } = await sb.from('Config_Empresas').update({ giro_especifico: nuevoGiro }).eq('id_empresa', idEmpresa);
      if (updErr) { console.error(`  ⚠️ Error actualizando giro: ${updErr.message}`); }
    } else {
      console.log(`✅ ${idEmpresa}: ya habilitado (${giroActual})`);
    }

    // Get existing procesos for this empresa to avoid duplicates
    const { data: existing } = await sb.from('Procesos_Cotizacion').select('nombre').eq('id_empresa', idEmpresa).eq('activo', true);
    const existingNames = new Set((existing || []).map(p => p.nombre));

    // Get global max PROC numeric id (across all empresas)
    const { data: allProcs } = await sb.from('Procesos_Cotizacion').select('id').like('id', 'PROC-%');
    let procCounter = 0;
    if (allProcs && allProcs.length > 0) {
      const nums = allProcs.map(p => parseInt(p.id.split('-').pop()) || 0);
      procCounter = Math.max(...nums);
    }

    // Get the processes for this giro (prefer giro_especifico base, fallback to tipo_negocio, then default)
    const procesos = procesosPorGiro[giroBase] || procesosPorGiro[tipoNegocio] || procesosPorGiro['Servicios'];
    let inserted = 0;

    for (const proc of procesos) {
      if (existingNames.has(proc.nombre)) {
        console.log(`  ⏭️ Ya existe: ${proc.nombre}`);
        continue;
      }
      procCounter++;
      const procId = 'PROC-' + String(procCounter).padStart(3, '0');
      const config = { precio_base: proc.precio, variables: [] };

      const { error: insErr } = await sb.from('Procesos_Cotizacion').insert({
        id: procId,
        id_empresa: idEmpresa,
        nombre: proc.nombre,
        descripcion: `${proc.nombre} - ${tipoNegocio}`,
        tipo: proc.tipo,
        config_calculadora: config,
        activo: true
      });

      if (insErr) {
        console.error(`  ❌ Error insertando ${proc.nombre}: ${insErr.message}`);
      } else {
        inserted++;
        console.log(`  ✅ ${procId}: ${proc.nombre} (${proc.tipo}) - $${proc.precio}`);
      }
    }

    if (inserted === 0) console.log(`  📌 Sin procesos nuevos para ${idEmpresa}`);
  }

  console.log('\n🎉 ¡Seed completado!');
}

main().catch(e => console.error('FATAL:', e));
