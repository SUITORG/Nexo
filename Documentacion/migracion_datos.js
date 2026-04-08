/**
 * SUITORG - SCRIPT DE MIGRACIÓN DE DATOS (v16.7.0)
 * Exporta datos del Excel y genera INSERTs para Supabase
 *
 * USO: node Documentacion/migracion_datos.js
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuración
const EXCEL_PATH = path.join(__dirname, 'SUITORG01-2026.xlsx');
const OUTPUT_PATH = path.join(__dirname, 'migracion_datos.sql');

// Tablas críticas a migrar (ordenadas por dependencias)
// Basado en estructura real de Supabase (23 tablas)
const TABLES_TO_MIGRATE = [
    // Maestro / Configuración
    'Config_Empresas',
    'Config_SEO',
    'Config_Paginas',
    'Config_Roles',
    'Config_Flujo_Proyecto',
    'Config_Galeria',
    'Config_Reportes',
    'Config_Dashboard',
    // Usuarios y Seguridad
    'Usuarios',
    // Operativas
    'Catalogo',
    'Leads',
    'Proyectos',
    'Pagos',
    'Proyectos_Pagos',
    'Proyectos_Etapas',
    'Proyectos_Bitacora',
    // IA y Logs
    'Prompts_IA',
    'Logs_Chat_IA',
    'Memoria_IA_Snapshots',
    'Logs',
    'Cuotas_Pagos',
    // Documentos y Reservas
    'Empresa_Documentos',
    'Reservaciones'
];

// Estructura exacta de columnas por tabla (desde CSV real de Supabase)
const TABLE_COLUMNS = {
    'Catalogo': ['id_empresa','id_producto','categoria','nombre','descripcion','precio','precio_oferta','unidad','es_combo','stock','min','max','imagen_url','activo','etiqueta_promo','contenido_combo','media','p/mes','p/mesof'],
    'Config_Dashboard': ['id_widget','titulo','tipo','tabla_origen','operacion','metrica','dimension','icono','color','giro','orden'],
    'Config_Empresas': ['id_empresa','nomempresa','es_principal','modo_sitio','db_engine','habilitado','modo','telefonowhatsapp','correoempresarial','foto_agente','slogan','mensaje1','mensaje2','mision','vision','valores','impacto','politicas','ubicacion_url','ubicacion','direccion','logo_url','fecha_creacion','tipo_negocio','color_tema','formulario','modo_creditos','creditos_totales','fecha_vencimiento','origen_politicas','infobanco','infocuenta','infonom','enlace_oficial','alias_seo','rsface','rsinsta','rstik','usa_otp_entrega','usa_features_estandar','is_isolated','usa_soporte_ia','id_notebooklm','usa_qr_sitio','usa_reservaciones','id_calendario_google','drive_folder_id','costo_envio','descripcion','factura','autodepuracion','whatsapp_negocio','url_logo_identidad','giro_especifico','slogan_empresa','agent_enabled'],
    'Config_Flujo_Proyecto': ['id_empresa','id_fase','nombre_fase','peso_porcentaje','orden','color_hex','descripcion'],
    'Config_Galeria': ['id_empresa','titulo','url_imagen','categoria','activo'],
    'Config_Paginas': ['id_empresa','id_pagina','id_cluster','meta_json','schema_json','contenido_json'],
    'Config_Reportes': ['id_reporte','nombre','tipo_negocio','tabla_origen','columnas','labels','filtro_base','acceso_minimo','habilitado','icono','descripcion'],
    'Config_Roles': ['id_empresa','id_rol','nombre_rol','nivel_acceso','creditos_base','vigencia_dias','modulos_visibles'],
    'Config_SEO': ['id_empresa','division','id_cluster','titulo','icono','keywords_coma','imagen_url','wa_directo','hex_color','mail_directo'],
    'Cuotas_Pagos': ['id_cuota','id_empresa','monto','fecha_vencimiento','estatus','nota'],
    'Empresa_Documentos': ['id_doc','id_empresa','id_drive_file','nombre_archivo','mimetype','fecha_sincronizacion','activo'],
    'Leads': ['fecha','id_lead','id_empresa','nombre','email','telefono','direccion','asunto','body','nivel_crm','rfc','nom_negocio','dir_comercial','subtipo_negocio','score_riesgo','status','motivo_status','apellido','edad','semanas_cotizadas','referido_por','nss','curp','hora_llamada'],
    'Logs': ['fecha','evento','usuario','detalle','id_empresa'],
    'Logs_Chat_IA': ['id_conversacion','id_visitante','id_empresa','agente_id','role','content','fecha_hora'],
    'Memoria_IA_Snapshots': ['id_conversacion','id_visitante','id_empresa','resumen_semantico','contexto_datos','ultimo_agente','estado_sesion','fecha_actualizacion'],
    'Pagos': ['id_empresa','id_proyecto','monto','metodo_pago','folio','fecha_pago','pago_con','cambio'],
    'Prompts_IA': ['id_agente','id_empresa','nombre','prompt_base','habilitado','nivel_acceso','recibe_files'],
    'Proyectos': ['id_proyecto','id_empresa','id_cliente','nombre_proyecto','estado','responsable','fecha_inicio','fecha_fin','line_items','descripcion','codigo_otp','activo','id_lead','nombre','status','fecha_estatus'],
    'Proyectos_Bitacora': ['id_empresa','id_evento','id_proyecto','tipo_evento','detalle','usuario','fecha_hora','activo'],
    'Proyectos_Etapas': ['id_empresa','id_etapa','id_proyecto','nombre_etapa','estado','fecha_compromiso','completada','fecha_cambio'],
    'Proyectos_Pagos': ['id_empresa','id_pago','id_proyecto','monto','concepto','metodo_pago','folio','referencia','fecha_pago','activo','pago_con','cambio'],
    'Reservaciones': ['id','id_empresa','fecha_cita','nombre_cliente','whatsapp','servicio','status'],
    'Usuarios': ['id_empresa','id_usuario','nombre','email','password','rol','nivel_acceso','creditos','fecha_limite_acceso','activo','fecha_creacion']
};

// Función para escapar valores SQL
function escapeSql(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return value.toString();

    const strValue = String(value);

    // Detectar fechas ISO (ej: 2026-04-05T04:19:59.135Z)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(strValue)) {
        return `'${strValue}'`;
    }

    // Detectar fechas simples (ej: 2026-04-05)
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
        return `'${strValue}'`;
    }

    // Detectar fechas con hora (ej: 2026-04-05 10:00:00)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(strValue)) {
        return `'${strValue}'`;
    }

    // String normal - escapar comillas simples
    const str = strValue.replace(/'/g, "''");
    return `'${str}'`;
}

// Función para convertir valor a JSON si es necesario
function toJsonIfNeeded(value) {
    if (value === null || value === undefined) return 'NULL';
    try {
        // Si ya es JSON válido, lo dejamos como está
        JSON.parse(value);
        return `'${String(value).replace(/'/g, "''")}'`;
    } catch {
        // No es JSON, retornamos como string normal
        return escapeSql(value);
    }
}

// Mapeo de tipos de columnas que requieren JSON
const JSON_COLUMNS = {
    'Config_Roles': ['modulos_visibles'],
    'Config_Paginas': ['meta_json', 'schema_json', 'contenido_json'],
    'Proyectos': ['line_items'],
    'Proyectos_Bitacora': ['detalle'],
    'Logs': ['detalle'],
    'Config_Reportes': ['columnas', 'labels'],
    'Prompts_IA': []
};

// Función principal
function generateMigrationSQL() {
    console.log('📖 Leyendo Excel:', EXCEL_PATH);

    const workbook = XLSX.readFile(EXCEL_PATH);
    const sqlOutput = [];

    sqlOutput.push('-- ============================================================================');
    sqlOutput.push('-- SUITORG - INSERTS DE DATOS MIGRADOS DESDE EXCEL');
    sqlOutput.push('-- Generado:', new Date().toISOString());
    sqlOutput.push('-- ============================================================================\n');

    TABLES_TO_MIGRATE.forEach(tableName => {
        const worksheet = workbook.Sheets[tableName];

        if (!worksheet) {
            console.warn(`⚠️ Tabla "${tableName}" no encontrada en el Excel`);
            return;
        }

        // Convertir a JSON
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            console.log(`⊘ Tabla "${tableName}" vacía - saltando`);
            return;
        }

        console.log(`✓ Migrando "${tableName}": ${data.length} filas`);

        // Usar columnas exactas de la estructura real de Supabase
        const columns = TABLE_COLUMNS[tableName] || Object.keys(data[0]);

        // Generar INSERTs
        sqlOutput.push(`-- Tabla: ${tableName} (${data.length} filas)`);

        data.forEach((row) => {
            const values = columns.map(col => {
                const value = row[col];
                // Verificar si es columna JSON
                const isJson = JSON_COLUMNS[tableName]?.includes(col);
                if (isJson) {
                    return toJsonIfNeeded(value);
                }
                return escapeSql(value);
            });

            sqlOutput.push(`INSERT INTO public."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT DO NOTHING;`);
        });

        sqlOutput.push('');
    });

    // Escribir archivo
    const content = sqlOutput.join('\n');
    fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');

    console.log('\n✅ Migración generada:', OUTPUT_PATH);
    console.log(`   Tamaño: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`);
    console.log('\n📋 PASOS SIGUIENTES:');
    console.log('   1. Ejecutar migracion_supabase.sql en Supabase SQL Editor');
    console.log('   2. Ejecutar migracion_datos.sql en Supabase SQL Editor');
    console.log('   3. Verificar que todas las tablas tengan datos');
    console.log('   4. Actualizar Config_Empresas SET db_engine = \'SUPABASE\'');
}

// Ejecutar
generateMigrationSQL();
