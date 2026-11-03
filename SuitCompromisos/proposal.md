# Propuesta — SuitCompromisos

> Entrada del Panel Juzgador (workflow `panel-juzgador`). Proyecto YA CONSTRUIDO; la evaluación es post-hoc sobre el estado real del código.

## Nombre
SuitCompromisos — pendientes personales con puente a Google Calendar.

## Descripción
App personal de compromisos/pendientes (viajes, reuniones, entregas, pagos) en un solo HTML estilo RUCP oscuro. Los artículos viven en `localStorage` (origen del navegador), se marcan hechos, se editan/borran, se exportan a `.ics` y — desde la integración nueva — **sincronizan con Google Calendar** vía un servidor local.

## Estado actual (hechos, 2026-11-03)
- **Frontend**: `SuitCompromisos/index.html` (vanilla JS, ~22 KB). CRUD de artículos con tipos, fecha/hora o "por confirmar", estados, export `.ics`, panel "Google Calendar".
- **Backend local**: `SuitCompromisos/server.js` — HTTP en `127.0.0.1:8138` (env `SUIT_COMPROMISOS_PORT`). Sin OAuth: **service account** (`../google-credentials.json`, raíz de SuitOrg) con scope Calendar. Requiere compartir el calendario destino con la cuenta de servicio con permiso "Hacer cambios en eventos".
- **Endpoints**: `GET /api/health`, `GET /api/status`, `POST /api/config`, `POST /api/create-calendar`, `POST /api/sync`. CORS restringido a origen `http://127.0.0.1:8137` (MASTER). Body máx 2 MB, JSON atómico (`.tmp` + rename).
- **Config**: `config.json` — `calendarId` del calendario "Compromisos" (America/Monterrey), `sharedWith`, `lastSync` (última: 2026-11-03).
- **Sync**: cada evento lleva `extendedProperties.private.suitId` → el servidor empareja artículos ↔ eventos (list/insert/update/delete), evita duplicados.
- **Integración MASTER**: pestaña `Compromisos` en `MASTER.html` (iframe a `:8137`), API llamada directa a `:8138`.
- **Registro**: fila `suit-compromisos` en `.suit/registry/projects.yaml` **desactualizada** (describe el prototype "sin servidor, solo .ics" — debe actualizarse).

## Alcance
- DENTRO: UI personal, server local Calendar bridge, config.json, sync bidireccional básico.
- FUERA: multi-tenant/id_empresa (es uso personal, no inquilino), OAuth de usuario, deploy fuera de la laptop, mobile app.

## Stack
- Frontend: vanilla JS (regla inmutable #7 ✓), un solo HTML.
- Backend: Node.js puro (`http`, sin framework), dependencia `googleapis` (ya en la raíz del repo).
- Datos: `localStorage` (artículos) + Google Calendar (espejo) + `config.json` (estado del puente).
- Puerto: **8138** (no listado en la tabla de puertos de `AGENTS.md`).

## Justificación
Centralizar pendientes personales en un solo panel y que lleguen como eventos/recordatorios al calendario compartido (rbtpdrn@gmail.com) sin depender de exportar `.ics` a mano.

## Preguntas que la evaluación debe responder
1. ¿La arquitectura (localStorage + service account en laptop) es sostenible o deuda técnica?
2. ¿Riesgos de seguridad/privacidad del service account y del CORS restringido?
3. ¿Vale la pena mantener el puente o conviene otra vía (Apps Script, API de usuario)?
4. ¿Qué tan mantenible es el emparejamiento suitId ↔ evento?
