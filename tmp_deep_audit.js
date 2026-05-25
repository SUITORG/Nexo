const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepAudit() {
    console.log("🕵️ Iniciando Auditoría Profunda de RLS...");
    
    // Probar Usuarios
    const { data: users, error: errU } = await supabase.from('Usuarios').select('id_empresa, email').limit(5);
    
    // Probar Leads
    const { data: leads, error: errL } = await supabase.from('Leads').select('id_empresa, nombre').limit(5);

    console.log("\n--- REPORTE TÉCNICO ---");
    
    if (users && users.length > 0) {
        console.log(`❌ VULNERABLE (Usuarios): He podido leer ${users.length} registros privados.`);
        console.log(`   Ejemplo: Empresa [${users[0].id_empresa}] - Email: ${users[0].email.substring(0,3)}...`);
    } else if (errU) {
        console.log("✅ PROTEGIDO (Usuarios): La base de datos rechazó la consulta.");
    } else {
        console.log("🤔 Usuarios: La tabla está vacía o RLS devolvió 0 filas.");
    }

    if (leads && leads.length > 0) {
        console.log(`❌ VULNERABLE (Leads): He podido leer ${leads.length} prospectos sin filtrar.`);
        console.log(`   Ejemplo: Empresa [${leads[0].id_empresa}] - Nombre: ${leads[0].nombre.substring(0,3)}...`);
    } else if (errL) {
        console.log("✅ PROTEGIDO (Leads): La base de datos rechazó la consulta.");
    } else {
        console.log("🤔 Leads: La tabla está vacía o RLS devolvió 0 filas.");
    }
}

deepAudit();
