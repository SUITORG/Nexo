# SuitOrg — Solución de Migración GSheets → Supabase

## El problema original
Al cambiar `db_engine = SUPABASE` en Config_Empresas, el sistema seguía leyendo desde GSheets. El catálogo aparecía vacío y el login no funcionaba con Supabase.

---

## Causa raíz (múltiples capas)

### 1. Error 401 en Supabase
Las tablas no tenían RLS habilitado. Supabase bloqueaba todas las peticiones con `HTTP 401 Unauthorized`.

**Solución:** Ejecutar en SQL Editor de Supabase:
```sql
ALTER TABLE public."Usuarios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura por empresa" ON public."Usuarios" FOR SELECT USING (true);

ALTER TABLE public."Config_Roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura por empresa" ON public."Config_Roles" FOR SELECT USING (true);

ALTER TABLE public."Catalogo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura por empresa" ON public."Catalogo" FOR SELECT USING (true);
```

### 2. El campo db_engine no se leía bien
Los encabezados de GSheets tienen variaciones de mayúsculas/espacios. `company.db_engine` devolvía `undefined`.

**Solución:** Función `getField()` que busca el campo sin importar el formato:
```javascript
const getField = (obj, keys) => {
    const foundKey = Object.keys(obj || {}).find(k => keys.includes(k.toLowerCase().trim()));
    if (!foundKey) return "";
    const val = obj[foundKey];
    return (val !== null && val !== undefined) ? val.toString().trim() : "";
};
```

### 3. El GAS devolvía GSHEETS desde Supabase
La tabla `Config_Empresas` en Supabase tenía `db_engine = GSHEETS` para PFM.

**Solución:** Actualizar el registro en Supabase:
```sql
UPDATE public."Config_Empresas" SET db_engine = 'SUPABASE' WHERE id_empresa = 'PFM';
```

### 4. El Hub Orbit no mostraba empresas
El filtro buscaba `modo_sitio` antes que `modo`. `NOHYBRIDO` no coincidía con `PROD`.

**Solución:** Corregir el orden del filtro en `public.js`:
```javascript
const valModo = String(co.modo || co.Modo || "PROD").trim().toUpperCase();
```

### 5. Catálogo vacío aunque los datos llegaban
El campo `activo` en Supabase llega como string `"true"` (minúsculas). El filtro solo aceptaba `"TRUE"`.

**Solución — patrón universal para todos los módulos:**
```javascript
const isActive = p.activo === true || String(p.activo).toUpperCase().trim() === "TRUE" || p.activo === "1" || p.activo === 1;
```

⚠️ **Este bug se repite en múltiples módulos** — buscar en `pos.js`, `public.js` y cualquier filtro de `activo`.

---

## Bloque SUPABASE OVERRIDE en core.js
Este es el bloque principal que detecta el motor y carga desde Supabase:

```javascript
const company = (app.data.Config_Empresas || [])
    .filter(c => c.id_empresa === app.state.companyId)
    .sort((a,b) => (b.db_engine||'').localeCompare(a.db_engine||''))[0];

const getField = (obj, keys) => {
    const foundKey = Object.keys(obj || {}).find(k => keys.includes(k.toLowerCase().trim()));
    if (!foundKey) return "";
    const val = obj[foundKey];
    return (val !== null && val !== undefined) ? val.toString().trim() : "";
};

if (data.engine_target) app.state.dbEngine = data.engine_target.toString().trim().toUpperCase();
const rawEngine = getField(company, ['db_engine', 'dbengine', 'motor', 'database']);
app.state.dbEngine = rawEngine.toUpperCase() || 'GSHEETS';

if (app.state.dbEngine === 'SUPABASE' && app.supabase) {
    try {
        const [usuariosRes, rolesRes, catalogoRes, proyectosRes] = await Promise.all([
            app.supabase.from('Usuarios').select('*').eq('id_empresa', app.state.companyId),
            app.supabase.from('Config_Roles').select('*').eq('id_empresa', app.state.companyId),
            app.supabase.from('Catalogo').select('*').eq('id_empresa', app.state.companyId),
            app.supabase.from('Proyectos').select('*').eq('id_empresa', app.state.companyId)
        ]);
        if (usuariosRes.data) app.data.Usuarios = usuariosRes.data;
        if (rolesRes.data) app.data.Config_Roles = rolesRes.data;
        if (catalogoRes.data) app.data.Catalogo = catalogoRes.data;
        if (proyectosRes.data) app.data.Proyectos = proyectosRes.data;
    } catch (sbErr) {
        console.warn('[SUPABASE] Falló carga desde Supabase, usando GSheets como respaldo.', sbErr);
    }
}
```

---

## Arquitectura de sincronización (objetivo)

### Regla principal
| db_engine | Lee primero | Replica a | Quién edita |
|---|---|---|---|
| SUPABASE | Supabase | GSheets (auto) | App/Frontend |
| GSHEETS | GSheets | Supabase (auto) | App/Frontend |

### 5 tablas MAESTRO — siempre en GSheets
Estas tablas SIEMPRE se editan en GSheets directamente. Supabase solo tiene copias de lectura:
- `Config_Empresas`
- `Config_SEO`
- `Config_Paginas`
- `Usuarios`
- `Config_Roles`

### Tablas PRIVATE — fuente según db_engine
- `Catalogo`, `Proyectos`, `Proyectos_Pagos`, `Proyectos_Bitacora`, `Logs`, `Config_Galeria`

### Tabla Proyectos — universal por tipo_negocio
- `tipo_negocio = Alimentos` → Proyectos = **Pedidos POS**
- `tipo_negocio = Servicios` → Proyectos = **Proyectos con etapas**

---

## Flujo actual (resumen)
1. Usuario entra → Hub Orbit carga empresas desde GSheets via GAS
2. Usuario selecciona negocio → `switchCompany(id_empresa)`
3. GAS lee `Config_Empresas` → detecta `db_engine`
4. Si `db_engine = SUPABASE` → bloque OVERRIDE carga tablas PRIVATE desde Supabase
5. Frontend recibe datos → Login, permisos, catálogo y proyectos funcionan con Supabase
6. Al guardar (checkout, nuevo proyecto) → guarda en Supabase y replica a GSheets

---

## Pendiente
- ✅ Catálogo visible en POS Caja desde Supabase
- ⚠️ `checkout` del POS Express debe guardar en Supabase (no solo GSheets)
- ⚠️ Sincronización automática bidireccional GSheets ↔ Supabase
- ⚠️ RLS por tenant (filtro por id_empresa en lugar de `USING (true)`)
- ⚠️ Agregar `Proyectos_Pagos` y `Proyectos_Bitacora` al bloque SUPABASE OVERRIDE
