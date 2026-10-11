# CONTRATO — SuitContractRenew
Alcance: `SuitContractRenew/` · Contrato padre: ninguno (producto propio, no tenant) · Fecha: 2026-10-11

## Propósito
SaaS de registro de contratos de mantenimiento con alertas de renovación 60 días antes para talleres (HVAC/plomería/eléctrica) de 1-5 técnicos. Idea ganadora `ideas-saas` 2026-10-10b (juez 7.8). El aviso ES el producto.

## Stack y ejecución
- Lenguaje / runtime: Node.js 18+ (Express, puerto 3017) + núcleo Python 3 stdlib (SQLite WAL)
- Comandos: instalar `npm install` · desarrollo `npm start` · pruebas `python python/main.py due 60` · smoke: `GET /api/health`, `POST /api/contracts`, `GET /api/contracts/due/60`
- Variables de entorno requeridas (solo nombres): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (leads de la landing), `PYTHON` (opcional, default `python`), `PORT` (opcional, default 3017)

## Datos y multi-inquilino
- Consume `Config_Empresas`: **no** — `id_empresa: null` (producto propio; brief local en `docs/BRIEF_CLIENTE.md`)
- Motores soportados: **sqlite-local** (núcleo `python/contractrenew.db`) + **SUPABASE** solo para `public.leads_<slug>` (insert server-side con service role, RLS sin policy de insert anon)
- Ubicación de esquema o migraciones: esquema inline idempotente en `python/db.py:init_db()` (`CREATE TABLE IF NOT EXISTS contracts`)
- Reglas de aislamiento entre empresas: N/A (base local por instancia del taller; un solo taller por despliegue MVP — POR CONFIRMAR multi-taller en un futuro)

## Límites
- Puede modificar: `SuitContractRenew/**` (index.js, handlers/, db/, python/, landing/, docs/)
- No debe tocar: nada fuera del alcance; `Config_Empresas`/GAS; el clone google-flow-mcp (solo lectura de assets ya generados)
- Dependencias con otros subproyectos: plantillas `GuiaTotal/plantillas/landing-leads/` y `brief-cliente.md` (referencia, no edición); server raíz NO lo monta

## Invariantes (no romper nunca)
1. Cierre de contratos = soft delete (`activo=0`), jamás `DELETE FROM`
2. El insert de leads va **solo** server-side con service role; el form de la landing nunca habla directo con Supabase
3. Núcleo Python sin dependencias de pago (stdlib: sqlite3, json, datetime) — `PYTHONIOENCODING=utf-8` en el spawn
4. Landing `noindex, nofollow` mientras sea demo interna (regla EvaSol)

## Definición de terminado
- Validación en PASA con evidencia en `VALIDACION.md`
- Commit por fase
- Sync de datos solo con visto bueno explícito

## Anexo heredado
Origen: `SuitIdeasSaaS/2026-10-10b-evaluacion.md` · ADR-049 (promoción), ADR-051 (4G: brief+landing+leads+activos Flow) · Landing con hero generado por Google Flow MCP

## POR CONFIRMAR
(todas resueltas)

### Resueltos (panel)
- [x] Integración de cobros (Stripe) → **suscripción mensual con Stripe en el futuro** (2026-10-11, panel)
- [x] ¿Un despliegue = un taller, o futuro multi-taller con login? → **un taller por cuenta en el MVP** (2026-10-11, panel)
- [x] Hosting/despliegue de producción → **continúa con lo más sencillo: local por ahora; hosting al primer cliente** (2026-10-11, panel)
- [x] Canal de notificación real de alertas → **por correo** (2026-10-11, panel)

## Cambios
- 2026-10-11: contrato inicial (fase 0 del ciclo) — verificado contra código: index.js, handlers/contracts.js, db/client.js, python/{main,db}.py, landing/, package.json
- 2026-10-11: 4 POR CONFIRMAR resueltos desde el panel web (cobros Stripe futuro · 1 taller/cuenta · local hasta primer cliente · alertas por correo)