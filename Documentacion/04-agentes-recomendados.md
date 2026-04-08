# SuitOrg — Agentes Recomendados para Avanzar Más Rápido

## ¿Qué es un agente en este contexto?
Un agente es una IA especializada con un rol específico. En lugar de preguntarle todo a un solo asistente, cada agente conoce su área a fondo y da respuestas más precisas y rápidas.

---

## Agentes recomendados para SuitOrg

### 1. Agente GAS (Google Apps Script)
**Para qué:** Modificar el backend, agregar tablas, sincronizar GSheets con Supabase automáticamente.

**Cómo activarlo en IDX:**
> "Eres un experto en Google Apps Script. El proyecto SuitOrg usa GAS como API entre GSheets y el frontend. La función principal es doGet(e) en core.gs. Tienes acceso a Supabase via UrlFetchApp con la key en PropertiesService. Responde siempre con: ARCHIVO, LÍNEA, CÓDIGO. Sin comentarios ni advertencias."

**Tareas clave:**
- Sincronización automática GSheets → Supabase al cambiar db_engine
- Agregar nuevas tablas al getAll
- Webhooks o triggers al editar GSheets

---

### 2. Agente Supabase / SQL
**Para qué:** Diseñar RLS, crear políticas de seguridad por tenant, optimizar queries.

**Cómo activarlo:**
> "Eres un experto en Supabase y PostgreSQL. El proyecto es multi-tenant con id_empresa como campo de filtro. Necesito políticas RLS que permitan a cada tenant ver solo sus datos. Responde con SQL exacto, sin explicaciones largas."

**Tareas clave:**
- RLS por id_empresa (no solo USING true)
- Índices para mejorar velocidad de queries
- Políticas de INSERT/UPDATE para el futuro panel admin

---

### 3. Agente Frontend / core.js
**Para qué:** Modificar la lógica de carga de datos, login, RBAC, switchCompany.

**Cómo activarlo en IDX:**
> "Eres un experto en JavaScript vanilla. El proyecto SuitOrg tiene su lógica principal en js/modules/core.js y auth.js. El sistema es multi-tenant con app.state.companyId como tenant activo y app.state.dbEngine para saber si lee de GSHEETS o SUPABASE. Responde siempre con: ARCHIVO, LÍNEA_NÚMERO, CÓDIGO. Sin comentarios."

---

### 4. Agente Sincronización (el más urgente)
**Para qué:** Resolver el pendiente más importante — cuando cambias db_engine en GSheets, que los datos se sincronicen automáticamente a Supabase.

**Cómo activarlo:**
> "Eres un experto en sincronización de datos entre Google Sheets y Supabase. El proyecto SuitOrg necesita que cuando un campo db_engine cambie a SUPABASE en GSheets, los datos de ese tenant se copien automáticamente a Supabase. Tienes GAS con acceso a UrlFetchApp y la Supabase REST API. Diseña la solución más simple posible."

**Opciones de solución:**
1. **Trigger en GAS** — `onEdit()` detecta cambio en db_engine y dispara sincronización
2. **Función manual en GAS** — botón en GSheets que sincroniza un tenant específico
3. **Webhook de Supabase** — Supabase notifica al GAS cuando hay cambios

**Recomendación:** Opción 2 primero (más simple), luego Opción 1.

---

## Cómo pedirle a IDX respuestas útiles

### Plantilla para debug:
> "Tengo este error: [PEGA EL ERROR]. El archivo es [ARCHIVO]. Dame la causa raíz y el fix exacto. Responde SOLO con: CAUSA, ARCHIVO, LÍNEA, CÓDIGO."

### Plantilla para nuevo código:
> "Necesito agregar [FUNCIONALIDAD] en [ARCHIVO]. El contexto es [CONTEXTO BREVE]. Responde SOLO con: ARCHIVO, LÍNEA_NÚMERO, CÓDIGO. Sin comentarios ni advertencias."

### Plantilla para SQL:
> "En Supabase, tabla [TABLA], necesito [OPERACIÓN]. El campo tenant es id_empresa. Dame el SQL exacto."

---

## Próximos pasos recomendados en orden

1. **Sincronización automática** — función en GAS que copia datos de GSheets a Supabase cuando db_engine cambia
2. **RLS por tenant** — cambiar `USING (true)` por `USING (id_empresa = current_setting('app.tenant'))`
3. **Panel admin básico** — formulario en la app para agregar usuarios sin tocar GSheets
4. **Encriptación de passwords** — al migrar usuarios a Supabase Auth
5. **Más tablas en OVERRIDE** — Leads, Proyectos, Reservaciones
