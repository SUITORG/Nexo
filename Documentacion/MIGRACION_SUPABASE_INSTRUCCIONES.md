# 📘 Migración Completa a Supabase - Instrucciones

## 📋 Resumen

Esta migración transfiere **todas las tablas operativas** de GSheets a Supabase, manteniendo GSheets como respaldo.

---

## 🔧 PASO 1: Ejecutar Script SQL en Supabase

1. Abre el dashboard de Supabase: https://supabase.com/dashboard
2. Navega a tu proyecto: `egyxgnlnzanxpqyuvmsg`
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `migracion_supabase.sql`
5. Ejecuta el script completo

**Qué hace este script:**
- Elimina tablas existentes (si las hay)
- Crea 27 tablas con estructura correcta
- Habilita RLS (Row Level Security) por `id_empresa`
- Crea índices para rendimiento

---

## 📦 PASO 2: Migrar Datos desde Excel

1. Ejecuta el script de migración:
```bash
node Documentacion/migracion_datos.js
```

2. El script generará `Documentacion/migracion_datos.sql` con todos los INSERTs

3. Ejecuta `migracion_datos.sql` en el SQL Editor de Supabase

**Datos migrados:**
| Tabla | Filas |
|-------|-------|
| Config_Empresas | 12 |
| Config_SEO | 39 |
| Config_Paginas | 38 |
| Usuarios | 33 |
| Config_Roles | 24 |
| Catalogo | 33 |
| Leads | 93 |
| Proyectos | 161 |
| Pagos | 51 |
| Proyectos_Pagos | 146 |
| Proyectos_Etapas | 12 |
| Proyectos_Bitacora | 63 |
| Config_Flujo_Proyecto | 26 |
| Prompts_IA | 18 |
| Logs_Chat_IA | 94 |
| Memoria_IA_Snapshots | 3 |
| Logs | 145 |
| Config_Galeria | 4 |
| Empresa_Documentos | 5 |
| Reservaciones | 2 |

---

## ⚙️ PASO 3: Configurar Google Apps Script

1. Abre tu Google Apps Script (GAS)
2. Ve a **Propiedades del Script** (Configuración)
3. Agrega estas propiedades:

```
SUPABASE_URL = https://egyxgnlnzanxpqyuvmsg.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneXhnbmxuemFueHBxeXV2bXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMDE2NjMsImV4cCI6MjA4OTY3NzY2M30.8nBh6b3pphZcM93Qi23Qa2_TB88ofGGWo18rsAszTrw
```

---

## 🧪 PASO 4: Verificar Datos en Supabase

Ejecuta estas consultas en el SQL Editor:

```sql
-- Verificar conteo de tablas críticas
SELECT 'Proyectos' as tabla, COUNT(*) FROM public."Proyectos" WHERE id_empresa = 'PFM'
UNION ALL
SELECT 'Leads', COUNT(*) FROM public."Leads" WHERE id_empresa = 'PFM'
UNION ALL
SELECT 'Catalogo', COUNT(*) FROM public."Catalogo" WHERE id_empresa = 'PFM'
UNION ALL
SELECT 'Pagos', COUNT(*) FROM public."Pagos" WHERE id_empresa = 'PFM';
```

---

## 🚀 PASO 5: Activar Supabase para un Tenant

Para activar Supabase para un tenant específico (ej. PFM):

```sql
-- Cambiar motor de base de datos
UPDATE public."Config_Empresas" 
SET db_engine = 'SUPABASE' 
WHERE id_empresa = 'PFM';
```

**Importante:** 
- Primero actualiza en Supabase
- Luego actualiza en GSheets (para consistencia)

---

## ✅ PASO 6: Pruebas de Validación

### 1. Prueba de Lectura
- Abre la aplicación web
- Selecciona el tenant migrado
- Verifica que el catálogo cargue
- Verifica que los proyectos aparezcan

### 2. Prueba de Escritura (POS)
- Agrega productos al carrito
- Completa un checkout
- Verifica que se guarde en Supabase
- Verifica que se replique a GSheets

### 3. Prueba de Stock
- Realiza una venta
- Verifica que el stock se actualice en `Catalogo`

---

## 🔒 Políticas RLS Configuradas

El script SQL incluye:

1. **Políticas de LECTURA** - Cada tenant solo ve sus datos
2. **Políticas de ESCRITURA** - API key tiene acceso completo
3. **Índices** - Para rendimiento en consultas frecuentes

---

## 📊 Arquitectura Resultante

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (app.js)                        │
│  - Detecta db_engine automáticamente                        │
│  - Carga TODAS las tablas desde Supabase                    │
│  - Checkout escribe en Supabase primero                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Google Apps Script)                   │
│  - processTransaction() escribe en Supabase                 │
│  - Replica a GSheets como respaldo                          │
│  - Fallback automático si Supabase falla                    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │   SUPABASE      │             │    GSHEETS      │
    │   (PRIMARY)     │             │    (BACKUP)     │
    │                 │             │                 │
    │ - 27 tablas     │             │ - Copia espejo  │
    │ - RLS activo    │             │ - Lectura lenta │
    │ - Escritura rápida│           │ - Respaldo      │
    └─────────────────┘             └─────────────────┘
```

---

## 🛠️ Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `js/modules/core.js` | `loadFromSupabase()` carga TODAS las tablas |
| `js/modules/pos.js` | `checkout()` escribe en Supabase + fallback GAS |
| `backend/utils.js` | `processTransaction()` escribe en Supabase primero |
| `Documentacion/migracion_supabase.sql` | Script SQL para crear tablas |
| `Documentacion/migracion_datos.sql` | INSERTs con datos migrados |

---

## ⚠️ Consideraciones Importantes

1. **Backup**: El `git stash` ya está creado. Puedes restaurar con `git stash pop`

2. **RLS**: Las políticas usan `current_setting('app.settings.id_empresa')` - el frontend debe pasar el tenant en cada query

3. **Sincronización**: GSheets se mantiene como respaldo - no eliminar datos

4. **Passwords**: Los passwords de Usuarios están en texto plano - encriptar en Fase 2

5. **Tenant PFM**: Es el tenant de prueba - verificar que `db_engine = 'SUPABASE'`

---

## 📞 Soporte

Si algo falla:

1. **Datos no cargan**: Verificar RLS en Supabase
2. **Checkout falla**: Revisar logs de consola (F12)
3. **Stock no actualiza**: Verificar que `id_producto` coincida
4. **Error 401**: Verificar que `SUPABASE_KEY` esté configurada

---

**Fecha de migración**: 2026-04-04  
**Versión**: v16.7.0  
**Estado**: Lista para producción (Fase 1 completada)
