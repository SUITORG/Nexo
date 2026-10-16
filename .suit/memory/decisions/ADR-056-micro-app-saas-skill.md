# ADR-056: Skill micro-app-saas (gate de forma + ruta de cobro)

## Status
Accepted (2026-10-16)

## Context
Faltaba una decisión explícita antes de diseñar un producto: **qué forma** debe tener (¿hace falta un SaaS entero, o basta una micro-app?) y **cómo se cobra**. `ideas-saas` asumía siempre el camino SaaS grande (módulo Suit* + login + landing + leads) incluso cuando una micro-app de pago único resolvía el problema; `GUIA.md` §3 tiene la doctrina "sitio vs aplicación" pero es documento, no decide. Los otros gates (`viabilidad-operativa`, `calidad-minima`, `durabilidad`) miden esfuerzo/ban, piso de calidad y futuro — ninguno toca **forma + dinero**. La búsqueda en repos externos no encontró una skill equivalente (lo más cercano, `plg-gtm-expert`, es de marketing, no decide formato ni viabilidad de cobro).

## Decision
Crear `micro-app-saas` (`.agents/skills/micro-app-saas/`, governance en `.suit/skills/process/micro-app-saas.yaml`, indexada en `.suit/registry/skills.yaml`) como **4º gate de pre-diseño**:

- **Forma** (2-3 preguntas): `micro-app` · `micro-saas` · `web-app` · `landing-leads` · `herramienta-interna` · `multi-tenant-gs`. Default `micro-app`; subir a `micro-saas` solo si vende a terceros **y** tiene uso repetido con login (80/20).
- **Ruta de cobro** (6 modelos): `pago-unico` · `suscripcion` · `por-uso` · `setup-mes` · `licencia-white-label` · `ahorro-interno`.
- **Gate duro:** sin ruta de cobro viable → `NO APTO` y se para (salvo herramienta-interna con consumidor definido → `APTO CON CONDICIONES` máx.).
- **Salida:** bloque `producto:` (formato, monetizacion, ruta_cobro, gate_cobro) en `GuiaTotal/registro/<slug>.yaml` + `FORMATO.md` (≤1 página) si el proyecto vive en disco.

**Enganches:** `guia-total` Flujo IDEA (paso 7) + "4 gates de pre-diseño" (antes eran 3); `ideas-saas` Etapa 1 (fija formato/cobro en la tarjeta de idea) y Etapa 3 (si no es `micro-saas`, omite el andamiaje SaaS — Etapa 4P y, si aplica, 4G.3).

## Rationale
- Evita construir SaaS por costumbre donde basta una micro-app (menos código, menos superficie, antes al cobro).
- El gate duro de cobro mata ideas sin modelo de negocio **antes** de invertir diseño — mismo espíritu que el gate 7.5 de `ideas-saas`.
- Los valores de formato se alinean con la tabla 4G.2 de `ideas-saas` (que ya decidía datos por tipo de producto), sin reescribirla (RUCP).
- No duplica los otros 3 gates: uno mide esfuerzo, otro calidad, otro futuro; este, forma y dinero.

## Consequences
- `guia-total` ahora tiene **4 gates de pre-diseño** (actualizar textos que digan "3 gates" en otras skills si aparecen).
- `ideas-saas` deja de producir siempre un SaaS completo: los formatos no-`micro-saas` entregan solo el núcleo.
- La tarjeta de proyecto gana el bloque `producto:` (plantilla `TARJETA-PROYECTO.md`; `schema.md` no cambia — regla 8: manda la plantilla).

## Related
- `.agents/skills/micro-app-saas/SKILL.md`, `.suit/skills/process/micro-app-saas.yaml`
- `.agents/skills/guia-total/SKILL.md` (Flujo IDEA paso 7 · 4 gates de pre-diseño)
- `.agents/skills/ideas-saas/SKILL.md` (Etapa 1 tarjeta · Etapa 3 gate de forma)
- ADR-048 / ADR-051 / ADR-054 (pipeline SaaS que este gate modula)
- `GuiaTotal/GUIA.md` §3 (doctrina sitio vs aplicación — fuente del criterio)
