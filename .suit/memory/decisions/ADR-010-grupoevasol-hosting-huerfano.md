# ADR-010: grupoevasol.com — Deployment Huérfano Fuera de CI/CD

**Date:** 2026-07-24
**Status:** Investigated — Sin resolver (pendiente de autorización)
**Risk:** Medio-Alto (afecta producción real de al menos un tenant, sin ruta de fix automatizada)
**Workflow:** investigacion

---

## Context

Durante la consolidación de URLs de GAS de esta sesión (fix de `js/modules/config.js` y 6+ archivos más hacia el deployment canónico `AKfycbzhWR6LoS7wirxWPhQBZIZJ2ynuQHa_VYzrIILR5rasOuCSE55Fk4f3M07fCmnyzEwN`), se verificó `https://suitorg.github.io/Nexo/js/modules/config.js` (correcto tras el deploy de GitHub Actions) y, por comparación, `https://grupoevasol.com/js/modules/config.js` — el dominio real referenciado en `og:url` del propio `index.html` del repo y usado como `enlace_oficial` de al menos el tenant EVASOL/SUITORG.

Resultado: sirve un `config.js` distinto, con un **quinto GAS deployment ID** nunca visto en el repo ni en `clasp deployments`.

## Root Cause

`grupoevasol.com` no es GitHub Pages ni ningún repo gestionado por este proyecto:

- **Nameservers:** `dns1-4.akkyhosting7.mx` → Akky Hosting (reseller mexicano, grupo Nominalia/Web.com)
- **IP:** `198.23.62.221`, `Server: LiteSpeed` (firma cPanel/WHM), ASN LiquidNet US LLC
- **Sin `CNAME`** en el repo → nunca fue configurado como dominio custom de GitHub Pages
- **`.suit/registry/projects.yaml`** y **`.suit/ARCHITECTURE.md`**: cero menciones de este dominio; los únicos destinos de deploy documentados son GAS y GitHub Pages

El contenido es un snapshot manual, subido por FTP/File Manager, de una versión anterior del mismo `index.html`:

| Archivo | Última modificación en grupoevasol.com | Versión servida |
|---|---|---|
| `index.html` | 2026-04-08 | `?v=16.7.23/24`, con Stripe.js/TensorFlow/nsfwjs aún en `<head>` |
| `js/modules/config.js` | 2026-06-05 (parche manual posterior, aislado) | GAS ID huérfano `AKfycbzyfrY0oZpcuj1HPJgNaWActq27WHOF0jyaLuSvBDGVJcoJ_RIfkTvXdngy15jVSjM7` |

El repo actual ya usa versionado por fecha (`?v=260424-0953`) y ya no carga esos scripts — confirma que son ramas de despliegue completamente divergentes.

## Decision

**Ninguna acción tomada.** Se documenta el hallazgo para decisión futura. Opciones evaluadas, pendientes de elegir:

1. **Migrar DNS** — apuntar `grupoevasol.com` (A record) a las IPs de GitHub Pages, o CNAME a `suitorg.github.io`, dejando el CI/CD actual como única fuente de verdad.
2. **Mantener Akky** pero sincronizar manualmente `index.html` + `js/modules/config.js` al estado actual del repo (requiere credenciales de hosting que no existen en este proyecto).

## Files Modified

Ninguno — investigación pura, sin cambios de código.

## Validation

- `nslookup`/`whois` (vía nameservers+ASN) confirmó hosting Akky, no GitHub Pages.
- `curl -sIL` y `curl -s` contra `grupoevasol.com` y su `config.js` confirmaron contenido y timestamps divergentes del repo.
- Grep sobre `.suit/registry/projects.yaml` y `.suit/ARCHITECTURE.md` confirmó cero documentación existente de este hosting.

## Consequences

- **Positive:** Se identificó la causa raíz del quinto deployment GAS huérfano; ya no es un misterio.
- **Negative:** El tenant que usa `grupoevasol.com` como `enlace_oficial` sigue sirviendo una versión vieja del sitio (sin las correcciones de rotación de IA de esta sesión) hasta que se decida y ejecute una de las dos opciones — **no se puede arreglar vía `clasp deploy` ni GitHub Actions**, requiere acceso al hosting Akky.
- **Neutral:** No hay riesgo de que este hallazgo rompa nada adicional; es un sistema aislado que ya estaba desincronizado antes de esta sesión.

---

*Decision recorded by SuitOS agent session — 2026-07-24*
