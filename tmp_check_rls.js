const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltan credenciales de Supabase en .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
    console.log("🔍 Iniciando Auditoría de Seguridad RLS...");
    
    // 1. Probar acceso a Usuarios (Suele ser sensible)
    const { data: users, error: errUsers } = await supabase.from('Usuarios').select('*').limit(1);
    
    // 2. Probar acceso a Leads (Privada por excelencia)
    const { data: leads, error: errLeads } = await supabase.from('Leads').select('*').limit(1);

    // 3. Probar acceso a Config_Empresas (Global)
    const { data: config, error: errConfig } = await supabase.from('Config_Empresas').select('*').limit(1);

    console.log("\n--- RESULTADOS ---");
    
    if (errUsers) {
        console.log("❌ Usuarios: BLOQUEADO (Probablemente RLS Activo)");
    } else {
        console.log("⚠️ Usuarios: ACCESO ABIERTO (Vulnerable si no hay RLS)");
    }

    if (errLeads) {
        console.log("❌ Leads: BLOQUEADO (Probablemente RLS Activo)");
    } else {
        console.log("⚠️ Leads: ACCESO ABIERTO (Vulnerable si no hay RLS)");
    }

    if (errConfig) {
        console.log("❌ Config_Empresas: BLOQUEADO");
    } else {
        console.log("ℹ️ Config_Empresas: ACCESO ABIERTO (Normal si es tabla global)");
    }
}

checkRLS();
