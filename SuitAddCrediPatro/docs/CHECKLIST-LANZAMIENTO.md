# CHECKLIST DE LANZAMIENTO - SuitAddCrediPatro

> **Para qué sirve:** verifica antes de usar/desplegar que funcione, esté documentado y sea operable. Basado en `GuiaTotal/GUIA.md` §4 (adaptado a herramienta interna estática).
> **Audiencia:** quien aprueba el uso (dev + responsable del proyecto).
> **Versión:** 1.0 · **Fecha:** 2026-11-12

---

## Funcionalidad

- [x] Flujo completo probado con 2 periles (NL/RESICO/capital e informal/marketing) — 2026-11-12
- [x] Sin destinos seleccionados → mensaje de aviso (probado)
- [x] Fallos de servicios externos — N/A (no hay servicios externos)

## Seguridad

- [x] HTTPS/HTTP — N/A (estático local, sin red)
- [x] Sin secretos en código (el módulo no maneja credenciales)
- [x] Roles y permisos — N/A (un usuario, herramienta interna)
- [x] `id_empresa` — N/A (no es multiempresa)
- [x] Validación de entrada — selects acotados; render con `escapeHtml`
- [x] Rate limiting — N/A (sin endpoints)

## Medición

- [x] Analytics/errores — N/A a propósito (herramienta interna; decisión ADR-063)

## Respaldo

- [x] Código respaldado vía git + `scripts/backup.sh`
- [x] Perfil del usuario: solo localStorage, sin respaldo — aceptado y documentado en `MANUAL_TECNICO.md` §7

## Documentación

- [x] `MANUAL_CLIENTE.md` actualizado (2026-11-12)
- [x] `MANUAL_PROVEEDOR.md` actualizado (2026-11-12)
- [x] `MANUAL_TECNICO.md` actualizado (2026-11-12)
- [x] `MANUAL_PRUEBAS.md` actualizado (2026-11-12)
- [x] `MANUAL_VENTAS.md` actualizado (2026-11-12)
- [x] `CONTRATO.md` al día (2026-11-12)
- [ ] `IDENTIDAD_CORPORATIVA.md` — no aplica (herramienta interna sin marca; si se comercializa, crear con `/guia-total identidad`)

## Legal (datos personales / información financiera)

- [x] No recolecta datos personales en servidor (perfil solo en localStorage local) — N/A política de privacidad
- [x] Aviso "informativo, confirma con cada institución" presente en el argumentario generado

---

**Aprobado:** (uso interno) · **Fecha:** 2026-11-12 · **Commit:** ADR-063 / registro `suitaddcredipatro`
