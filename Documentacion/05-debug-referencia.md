# SuitOrg — Referencia Rápida de Debug

## Filtros útiles para la consola F12

| Filtro | Qué muestra |
|---|---|
| `DEBUG Final` | Motor de BD detectado (GSHEETS o SUPABASE) |
| `DEBUG-RAW` | Datos crudos de Config_Empresas para el tenant |
| `SUPABASE` | Confirmación de carga desde Supabase |
| `SENSOR_REDE` | Peticiones al GAS |
| `CORTAFUEGOS` | Peticiones bloqueadas o duplicadas |
| `DATA_LOAD` | Errores críticos de carga |

---

## Mensajes esperados al entrar a un tenant SUPABASE
```
[DEBUG] dbEngine Final: SUPABASE | companyId: PFM  ✅
[SUPABASE] Usuarios, Config_Roles y Catalogo cargados.  ✅
```

## Mensajes de problema
```
[DEBUG] dbEngine Final: GSHEETS | companyId: PFM  ⚠️ No detectó SUPABASE
[DATA_LOAD_CRITICAL] HTTP Error! Status: 404  ⚠️ GAS caído o URL incorrecta
[CORTAFUEGOS] Petición duplicada bloqueada  ⚠️ Loop de recargas
Orbit Hub: 0 empresas detectadas  ⚠️ Filtro de Hub rechazando todo
```

---

## Checklist cuando algo no funciona

### ¿El Hub está vacío?
- [ ] ¿El GAS responde? → probar URL con `?action=ping`
- [ ] ¿La URL del GAS está actualizada en el código?
- [ ] ¿Las empresas tienen `habilitado=TRUE` y `modo=PROD` en GSheets?

### ¿El catálogo está vacío?
- [ ] ¿`dbEngine Final` dice SUPABASE en la consola?
- [ ] ¿Hay registros en Supabase? → `SELECT COUNT(*) FROM "Catalogo" WHERE id_empresa = 'X'`
- [ ] ¿El campo `activo` tiene valor `true` o `TRUE`?
- [ ] ¿RLS está habilitado con política de lectura?

### ¿El login no funciona?
- [ ] ¿Hay usuarios en Supabase para ese tenant?
- [ ] ¿El campo `activo` del usuario es TRUE?
- [ ] ¿La fecha_limite_acceso no está vencida?

### ¿Error 401 en Supabase?
```sql
-- Ejecutar en SQL Editor de Supabase
ALTER TABLE public."NombreTabla" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica" ON public."NombreTabla" FOR SELECT USING (true);
```

### ¿Error 404 en GAS?
1. Ir a Apps Script → Implementar → Administrar implementaciones
2. Copiar URL activa
3. Actualizar `app.apiUrl` en el código
4. Ejecutar cualquier función para reautorizar

---

## Comandos útiles para la consola del navegador
```javascript
// Ver motor actual
app.state.dbEngine

// Ver tenant activo
app.state.companyId

// Ver cuántos productos hay
app.data.Catalogo?.length

// Ver primer producto y su campo activo
console.log(app.data.Catalogo?.[0]?.activo, typeof app.data.Catalogo?.[0]?.activo)

// Ver empresas y sus campos clave
app.data.Config_Empresas.map(c => ({id: c.id_empresa, hab: c.habilitado, modo: c.modo, engine: c.db_engine}))
```

---

## URLs importantes
| Recurso | URL |
|---|---|
| Supabase Dashboard | https://supabase.com/dashboard/project/egyxgnlnzanxpqyuvmsg |
| GAS ping | `[URL_GAS]/exec?action=ping` |
| GAS ping con tenant | `[URL_GAS]/exec?action=ping&id_empresa=PFM` |
