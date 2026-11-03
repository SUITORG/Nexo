# MANUAL_TECNICO — SuitCompromisos

**Para qué sirve este manual:** operar, mantener y depurar el puente local de SuitCompromisos con Google Calendar.
**Audiencia:** técnico / el dueño del proyecto (uso personal, un solo usuario).

**Última actualización:** 2026-11-03

## Resumen en corto

| Campo | Valor |
|---|---|
| Tipo | Herramienta interna personal (no multi-tenant, no público) |
| Frontend | `index.html` vanilla JS (un solo archivo, sin build) |
| Backend | `server.js` Node puro (http, sin framework) en `127.0.0.1:8138` |
| BD | `localStorage` del navegador (artículos) + Google Calendar (espejo) |
| Sheets | No |
| Config | `SuitCompromisos/config.json` (gitignorado — PII) |
| Cómo correrlo | `node SuitCompromisos/server.js` y abrir la pestaña **Compromisos** en MASTER (:8137) |
| Puerto | **8138** (registry: `AGENTS.md` + `projects.yaml` → `suit-compromisos`) |

## 1. Arquitectura

```
index.html (vanilla, localStorage)  ──fetch──►  server.js :8138  ──googleapis──►  Google Calendar
   ▲ pestaña en MASTER :8137 (iframe)              │ service account: ../google-credentials.json
   └── API llamada directa a :8138 (CORS permite solo origen :8137)      └── calendario "Compromisos" compartido con sharedWith
```

- **Fuente de verdad local:** `localStorage` (clave del panel). Calendar es espejo de sincronización.
- **Emparejamiento:** cada evento lleva `extendedProperties.private.suitId` = id del artículo → upsert sin duplicados; si el artículo no existe, el evento se marca/ignora según `suitcompromisos=1`.
- **Config atómica:** writes a `config.json.tmp` + rename (nunca queda archivo a medias).

## 2. Requisitos de equipo

- Laptop encendida para sync (el server corre local; SPOF aceptado por diseño — ver veredicto condición 5).
- Node.js con `googleapis` instalado en la **raíz** de SuitOrg (`npm install` en raíz).
- `google-credentials.json` en la **raíz** de SuitOrg (service account, gitignorado).
- Calendario destino compartido con el correo de la SA con permiso **"Hacer cambios en eventos"**.
- Chrome/Edge actualizado (uso vía MASTER).

## 3. Arranque y verificación

```bash
node SuitCompromisos/server.js          # opcional: SUIT_COMPROMISOS_PORT=8138
# o doble click en SuitCompromisos (si existe .bat) / desde el lanzador habitual
```

Smoke (obligatorio tras tocar `server.js`):

```bash
node --check SuitCompromisos/server.js
curl http://127.0.0.1:8138/api/health     # → {"ok":true}
curl http://127.0.0.1:8138/api/status     # → calendario, lastSync, SA
```

## 4. Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/health` | liveness `{"ok":true}` |
| GET | `/api/status` | calendario (id/resumen/tz), `sharedWith`, `lastSync`, email de la SA |
| POST | `/api/config` | guarda `calendarId`/`sharedWith` en config.json (atómico) |
| POST | `/api/create-calendar` | crea el calendario con la SA y guarda su id |
| POST | `/api/sync` | sube/baja artículos ↔ eventos (cola serializada, idempotente por `suitId`) |

CORS: solo `http://127.0.0.1:8137` (MASTER). Body máx 2 MB. **Sin token** (condición 2 del veredicto pendiente).

## 5. Seguridad (estado actual y deuda)

- SA con scope `auth/calendar` completo (condición 2: reducir a `calendar.events`).
- `Origin: null` aceptado en `isAllowedOrigin` (condición 2: eliminar).
- `config.json` y `server.log` **gitignorados** (PII: calendarId, email, eventos).
- `google-credentials.json` en raíz, gitignorado (condición 5: mover a path dedicado o aceptar SPOF).
- El repo completo se publica en GitHub Pages: **nunca** commitear config/log/credenciales.

## 6. Backup de datos

- Artículo viven en `localStorage` del navegador del panel → **Exportar** del panel (JSON/.ics) antes de limpiar navegador (condición 3: automatizar dump).
- Calendar actúa como espejo parcial (lo sincronizado).

## 7. Troubleshooting

| Síntoma | Causa probable | Acción |
|---|---|---|
| `Falta googleapis` | node_modules raíz incompleto | `npm install` en raíz de SuitOrg |
| `No existe google-credentials.json` | SA ausente | restaurar el archivo en raíz (no está en git) |
| Sync rechaza 403 | calendario no compartido con la SA | compartir con "Hacer cambios en eventos" |
| La pestaña MASTER no responde al sync | server :8138 apagado | levantar server; health debe dar200 |
| Eventos duplicados | `suitId` perdido | no borrar eventos a mano desde Calendar; re-sync corrige |
| Datos distintos al abrir "por fuera" | origen distinto (file:// ≠ :8137) | usar siempre la pestaña del MASTER |

## 8. Relación con el panel juzgador

Evaluación 2026-11-03: **APROBADO CONDICIONAL (6.75/10)** — veredicto y condiciones en `.suit/logs/panel-juzgador/veredicto.md`; tarjeta en `GuiaTotal/registro/suitcompromisos.yaml`.
