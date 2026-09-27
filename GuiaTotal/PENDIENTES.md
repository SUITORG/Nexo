# PENDIENTES.md — Guía Total

> **Para qué sirve:** pendientes de la **metodología** (Guía Total + proyectos ya estandarizados). Lo que se resuelve se tacha con fecha; **nunca se borra una fila** (historial). Se revisa al abrir cualquier pasada de `/guia-total`.
> **Alcance:** guía y sus proyectos. Deuda/planes de SuitOS → `.suit/memory/pending/` · roadmap de productos → `ROADMAP_PENDIENTES.md` (raíz) · siguiente paso por proyecto → `GuiaTotal/registro/<proyecto>.yaml → proximo_paso`.

## Dónde vive cada tipo de pendiente (no duplicar)

| Tipo | Archivo |
|---|---|
| Pendientes de la **guía** y proyectos estandarizados | **este archivo** |
| Siguiente paso de UN proyecto | `GuiaTotal/registro/<proyecto>.yaml → proximo_paso` |
| Deuda por proyecto (resultado de auditoría) | `<Proyecto>/docs/15-riesgos-deuda-tecnica-y-backlog.md` (estándar `auditoria`, aún sin crear) |
| Errores/aprendizajes de ejecución (ciclo) | `<Alcance>/CORRECCIONES.md` |
| Sync/depura esperando visto bueno | `<Alcance>/PLAN-SYNC.md`, `PLAN-DEPURA.md` |
| Deuda técnica SuitOS | `.suit/memory/pending/tech-debt.yaml` + `plan-*.md` |
| Roadmap de productos Suit* | `ROADMAP_PENDIENTES.md` (raíz) |
| Roadmap general SuitOrg | `roadmap.md` (raíz) |

## Abiertos

- [ ] **SuitServiHogar — drift SQL**: definir fuente canónica (`supabase/migrations/` recomendado) y copiar las 3 migraciones que solo existen en `migrations/` (`price_negotiation`, `antifuga_config`, `decisions_config`). *Abierto: 2026-09-26 — decisión de esquema, requiere visto bueno.*
- [ ] **SuitServiHogar — docs de auditoría faltantes**: `09-reglas-de-negocio`, `11-integraciones-y-contratos`, `13-despliegue-y-operacion`, `15-riesgos-deuda-tecnica-y-backlog` (evidencia ≥84%, pendiente aprobación). *2026-09-26*
- [ ] **SuitServiHogar — `AGENTS.md` desactualizado**: dice `screens/ (7)`, hay 13. *2026-09-26*
- [ ] **SuitDashboard — instancias faltantes** (ver tarjeta `documentos: false`): 4 manuales, identidad, prompt origen, checklist, `docs/05+06` de auditoría. *2026-09-26*
- [ ] **Integración profunda `auditoria` ↔ `guia-total`** (punto 7: "en su debido momento") — hoy solo hay gancho en MAPA + nodo §4. *2026-09-26*
- [ ] **Skills externas**: guion `MAPA.md §10` vacío — rellenar cuando se pida instalar/enlazar una. *2026-09-26*
- [ ] **Registro SuitOS**: `guia-total` y `auditoria` no están en `.suit/registry/skills.yaml` (decisión pendiente del install: ¿gobierno SuitOS?). *2026-09-26*
- [ ] **Push a GitHub**: rama `evasol-supabase-migration` ahead 44 — pendiente de decisión. *2026-09-26*

## Cerrados

- [x] Instalar skill `auditoria` + routing + MAPA (2026-09-26 → `2d08a58`, `bc2790d`)
- [x] Estandar `docs/` migrado en SuitServiHogar y SuitDashboard + fix `contractFor` (2026-09-26 → `e721f1e`)
- [x] Taxonomías por proyecto creadas (SuitServiHogar, SuitDashboard) (2026-09-26)
- [x] Limpieza SuitServiHogar (ruido borrado, evaluaciones a `docs/`) (2026-09-26)
