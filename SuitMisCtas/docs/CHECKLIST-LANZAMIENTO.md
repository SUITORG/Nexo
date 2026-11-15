# CHECKLIST DE LANZAMIENTO - SuitMisCtas

> **Para qué sirve:** verificar antes de usar/desplegar que funcione, esté documentado y sea operable. Basado en `GuiaTotal/GUIA.md` §4 (adaptado a herramienta interna local).
> **Audiencia:** quien aprueba el uso (dev + dueño).
> **Versión:** 1.0 · **Fecha:** 2026-11-14

---

## Funcionalidad
- [x] Puerta canónica: `suitorg-menu.bat` → [4] → [7] MASTER → SuitMisCtas (`:8137`) — 2026-10-21
- [x] Flujo base probado: alertas, captura+clasificación, servicios Pagado, rentas Recibido, resumen+proyección, export/import — 2026-10-20/21
- [x] Filtros + subtotales en Registro — 2026-11-14 (commit pendiente del usuario)
- [x] Fallos de servicio externo: Gmail (`:3021`) degrada con mensaje; `gastos.json` muestra "—" si no refresca

## Seguridad
- [x] Sin secretos en código (el módulo no maneja credenciales)
- [x] Roles/permisos — N/A (un usuario)
- [x] `id_empresa` — N/A (herramienta personal, `noindex, nofollow`)
- [x] Validación de entrada: montos numéricos, escape en renders; categorías/cuentas acotadas a chips editables
- [x] Sin endpoints propios ni rate limiting (estático)

## Medición
- [x] Analytics/errores — N/A a propósito (herramienta personal, datos locales)

## Respaldo
- [x] Código respaldado vía git + `scripts/backup.sh`
- [x] Datos: solo localStorage — riesgo aceptado; rutina de export en `MANUAL_PROVEEDOR.md` §5; referencia `respaldos/suitmisctas-2026-10-21.json`

## Documentación
- [x] `MANUAL_CLIENTE.md` (2026-11-14)
- [x] `MANUAL_PROVEEDOR.md` (2026-11-14)
- [x] `MANUAL_TECNICO.md` (2026-11-14)
- [x] `MANUAL_PRUEBAS.md` (2026-11-14)
- [x] `MANUAL_VENTAS.md` (2026-11-14)
- [x] `CONTRATO.md` (2026-11-14)
- [x] `TAXONOMIA.md` · `PROMPT_ORIGEN.md` (2026-11-14)
- [ ] `IDENTIDAD_CORPORATIVA.md` — no aplica (herramienta interna sin marca)
- [ ] Tarjeta `GuiaTotal/registro/suitmisctas.yaml` — creada con esta corrida

## Legal (información financiera personal)
- [x] No envía datos financieros a servidores (todo local; Gmail es solo lectura de semáforo vía servicio local)
- [x] Sin datos de terceros: rentas de inquilinos son nombres/estados operativos del usuario

---

**Aprobado:** (uso interno) · **Fecha:** 2026-11-14 · **Registro:** `suitmisctas`
**Pendiente de cierre:** commit de filtros+subtotales 2026-11-14 (usuario)
