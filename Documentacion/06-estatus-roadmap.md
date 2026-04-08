# SuitOrg — Estatus Actual y Roadmap a Producción

## Estatus al 05 de Abril 2026

### ✅ Funcionando
| Qué | Dónde |
|---|---|
| Hub Orbit muestra empresas | GSheets → Frontend |
| Login con roles y permisos (RBAC) | GSheets |
| Catálogo de productos visible | Supabase (PFM) |
| Detección automática de db_engine | core.js |
| Usuarios y Config_Roles desde Supabase | core.js OVERRIDE |
| RLS habilitado en Supabase | Usuarios, Config_Roles, Catalogo |
| GAS funcionando como API | core.gs |
| Multi-tenant básico | switchCompany() |
| **`saveRecord()` — escritura directa a Supabase** | **core.js** |
| **Políticas INSERT/UPDATE en tablas de producción** | **Supabase** |
| **saveProject() escribe directo a Supabase** | **admin.js** |
| **updateProjectStatus() escribe directo a Supabase** | **admin.js** |
| **addProjectStage() escribe directo a Supabase** | **admin.js** |
| **toggleStage() escribe directo a Supabase** | **admin.js** |
| **addProjectPayment() escribe directo a Supabase** | **admin.js** |

### ⚠️ Funciona pero con limitaciones
| Qué | Limitación |
|---|---|
| RLS en Supabase | Política abierta (`USING true`) — cualquiera con la anon key lee todo |
| Login | Passwords en texto plano en GSheets |
| Sincronización GSheets→Supabase | Manual — hay que editar Supabase directamente |
| **Catálogo en POS** | **Solo muestra 1 producto — bug activo a investigar** |

### ❌ Pendiente
| Qué | Impacto |
|---|---|
| **Bug: Catálogo POS muestra solo 1 producto con db_engine=SUPABASE** | **Alto** |
| Sincronización automática GSheets→Supabase | Alto |
| Panel admin para agregar usuarios sin tocar GSheets | Alto |
| RLS por tenant (filtro real por id_empresa) | Medio |
| Encriptación de passwords | Medio |
| Modo HIDDEN probado en producción | Bajo |
| Modo HYBRID probado en producción | Bajo |

---

## Clasificación de Tablas (Redefinida 05-Abril-2026)

### 🧠 CEREBRO — Siempre GSheets (edita un humano admin)
| Tabla | Notas |
|---|---|
| `Config_Empresas` | Fuente de verdad del sistema |
| `Config_Paginas` | Configuración estática |
| `Config_SEO` | Configuración estática |
| `Config_Roles` | Permisos por tenant |
| `Usuarios` | Seguridad — no migra aún |
| `Catalogo` | Lo edita el admin, no el sistema |
| `Config_Flujo_Proyecto` | Plantilla de etapas |
| `Config_Galeria` | Configuración estática |
| `Config_IA_Notebooks` | Configuración de IA |
| `Prompts_IA` | Configuración de IA |

### ⚡ PRODUCCIÓN — Supabase escribe directo
| Tabla | Campo ID | Velocidad | Estado |
|---|---|---|---|
| `Proyectos` | `id_proyecto` | Media | ✅ Conectado |
| `Proyectos_Etapas` | `id_etapa` | Media | ✅ Conectado |
| `Proyectos_Pagos` | `id_pago` | Media | ✅ Conectado |
| `Pagos` | `id_pago` | Media | ✅ Políticas listas |
| `Proyectos_Bitacora` | `id_bitacora` | Alta | ✅ Políticas listas |
| `Proyectos_Materiales` | `id_material` | Media | ✅ Políticas listas |
| `Leads` | `id_lead` | Media | ⏳ Pendiente conectar |
| `Reservaciones` | `id_reservacion` | Alta | ⏳ Pendiente conectar |
| `Logs` | `id_log` | Alta | ⏳ Pendiente conectar |
| `Logs_Chat_IA` | `id_log` | Alta | ⏳ Pendiente conectar |

---

## Arquitectura de db_engine (Definida 05-Abril-2026)

| Valor `db_engine` | Lee de | Escribe a | Notas |
|---|---|---|---|
| `GSHEETS` | GSheets via GAS | GSheets via GAS | Flujo original |
| `SUPABASE` | Supabase directo | Supabase directo | Opción B activa |

**Regla fija:** El valor de `db_engine` en Supabase siempre es `SUPABASE` — no necesita actualizarse. Es solo una llave que identifica la fuente activa.

**GSheets** sigue siendo el cerebro para tablas CEREBRO. Solo las tablas PRODUCCIÓN escriben directo a Supabase.

---

## Potencial de producción por tenant

### Tenant en GSHEETS puro
**Estado: LISTO PARA PRODUCCIÓN ✅**
- Todo funciona como siempre
- Sin cambios necesarios
- Riesgo: bajo

### Tenant migrado a SUPABASE
**Estado: BETA AVANZADO ⚠️**
- Lee 21 tablas desde Supabase ✅
- Escribe Proyectos, Etapas y Pagos directo a Supabase ✅
- Bug de catálogo en POS activo ⚠️
- Passwords en texto plano ⚠️
- RLS abierto (no filtrado por tenant) ⚠️

---

## Roadmap a Producción

### FASE 1 — Estabilización (EN CURSO)
| Tarea | Dificultad | Impacto | Estado |
|---|---|---|---|
| `saveRecord()` en core.js | Baja | Alto | ✅ Listo |
| Políticas INSERT/UPDATE en Supabase | Baja | Alto | ✅ Listo |
| Conectar admin.js a saveRecord() | Media | Alto | ✅ Listo |
| **Bug catálogo POS — solo muestra 1 producto** | Media | Alto | ❌ Pendiente |
| Función GAS que sincroniza GSheets→Supabase | Media | Alto | ❌ Pendiente |

### FASE 2 — Seguridad (2-3 semanas)
| Tarea | Dificultad | Impacto |
|---|---|---|
| RLS por id_empresa en todas las tablas | Media | Alto |
| Encriptación de passwords | Alta | Alto |
| Panel básico para agregar usuarios desde la app | Media | Alto |

### FASE 3 — Escalabilidad (1 mes)
| Tarea | Dificultad | Impacto |
|---|---|---|
| Migración automática completa al cambiar db_engine | Alta | Alto |
| Dashboard de administración multi-tenant | Alta | Alto |
| Logs de actividad por tenant en Supabase | Media | Medio |

---

## Lo más urgente ahora mismo

1. **Bug catálogo POS** — investigar por qué solo aparece 1 producto con db_engine=SUPABASE
2. **Conectar Leads a saveRecord()** — siguiente módulo en admin.js
3. **RLS por tenant** — cambiar políticas `USING (true)` por filtro real de id_empresa
