# SuitOrg — Resumen de Sesión para IDX
## Fecha: 05 de Abril 2026

---

## Lo que se hizo hoy

### 1. Nueva función `saveRecord()` en `core.js`
Se agregó al final del objeto `app`, después de `createAgentTask`.
Escribe directo a Supabase cuando `db_engine = SUPABASE`.
Hace UPSERT automático (INSERT si no existe, UPDATE si ya existe).
Tiene fallback a GAS si el motor es GSHEETS.

### 2. Políticas de escritura en Supabase
Se habilitaron INSERT y UPDATE en estas tablas:
- `Proyectos`
- `Pagos`
- `Proyectos_Pagos`
- `Proyectos_Etapas`
- `Proyectos_Bitacora`
- `Proyectos_Materiales`

### 3. Funciones actualizadas en `admin.js`
Estas funciones ahora usan `saveRecord()` cuando `dbEngine = SUPABASE`,
y mantienen el flujo original de GAS como fallback:
- `saveProject()` — genera `id_proyecto` con `'PROJ-' + Date.now()`
- `updateProjectStatus()` — actualiza `status`, `estado` y `fecha_estatus`
- `addProjectStage()` — genera `id_etapa` con `'ETAPA-' + Date.now()`
- `toggleStage()` — busca la etapa por `id_proyecto` + `nombre` y actualiza `completado`
- `addProjectPayment()` — genera `id_pago` con `'PAGO-' + Date.now()`

---

## Bug activo — PRIORIDAD ALTA

**Síntoma:** Con `db_engine = SUPABASE`, el POS (punto de venta) solo muestra 1 producto del catálogo.
**Lo que sabemos:** La carga de 21 tablas desde Supabase funciona correctamente (confirmado en consola).
**Sospecha:** El filtro de productos activos en el POS puede estar fallando con el formato que llega desde Supabase.

**Para investigar en el código:**
Buscar dónde se renderiza el catálogo en el POS. Probablemente en `pos.js` o `public.js`.
El campo `activo` en Supabase llega como string `"true"` (minúsculas), no como booleano.
El filtro debe ser:
```javascript
const isActive = p.activo === true || String(p.activo).toUpperCase().trim() === "TRUE" || p.activo === "1" || p.activo === 1;
```
Verificar también si hay un filtro por `id_empresa` que esté fallando.

---

## Arquitectura definida hoy

### Tablas CEREBRO — Solo GSheets (no escriben desde la app)
`Config_Empresas`, `Config_Paginas`, `Config_SEO`, `Config_Roles`,
`Usuarios`, `Catalogo`, `Config_Flujo_Proyecto`, `Config_Galeria`,
`Config_IA_Notebooks`, `Prompts_IA`

### Tablas PRODUCCIÓN — Supabase escribe directo
`Proyectos`, `Proyectos_Etapas`, `Proyectos_Pagos`, `Pagos`,
`Proyectos_Bitacora`, `Proyectos_Materiales`, `Leads`, `Reservaciones`,
`Logs`, `Logs_Chat_IA`

---

## Regla de db_engine
- Si `db_engine = GSHEETS` → lee y escribe via GAS
- Si `db_engine = SUPABASE` → lee y escribe directo a Supabase
- El valor en Supabase siempre es `SUPABASE` — no necesita actualizarse nunca

---

## Siguiente tarea sugerida
Investigar y corregir el bug del catálogo en POS.
Buscar en `pos.js` o `public.js` la función que renderiza productos
y verificar el filtro del campo `activo`.
