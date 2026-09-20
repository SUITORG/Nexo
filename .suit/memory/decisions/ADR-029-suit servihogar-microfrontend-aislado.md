# ADR-029: SuitServiHogar — Micro-frontend Aislado (Excepción React)

**Date:** 2026-09-16
**Status:** Aceptado (2026-09-16)
**Risk:** Bajo (proyecto aislado, no integra al SPA principal)
**Workflow:** feature (resolución de conflicto arquitectónico)

---

## Context

SuitServiHogar es un marketplace bilateral de servicios del hogar para Reynosa, Tamaulipas. El proyecto está completo (41/41 requerimientos funcionales) y funcional, pero utiliza **React 19 + TypeScript** como frontend, lo cual viola la **Regla #7 de SuitOrg**: "No frontend frameworks — vanilla JS only".

El Panel Juzgador evaluó el proyecto y detectó este conflicto:
- **Agente Técnico:** Penaliza el uso de React (violación de regla #7, learning curve para el equipo SuitOrg)
- **Agentes Mercado y Financiero:** Valor el MVP funcional y el tiempo de mercado
- **Puntuación total:** 7.25/10 (APROBADO CONDICIONAL)

Se evaluaron tres alternativas:
1. **Reescribir a vanilla JS:** +2-3 meses de desarrollo, retraso de lanzamiento, riesgo de romper funcionalidad existente
2. **Integrar al SPA principal SuitOrg:** Requiere refactorizar todo el ecosistema, alto riesgo, bajo beneficio inmediato
3. **Micro-frontend aislado:** Mantener React, operar como standalone, conectar vía URLs/APIs

## Decision

**SuitServiHogar se opera como micro-frontend aislado**, independiente del SPA principal de SuitOrg.

### Definición
- **Proyecto aislado:** No se integra al `index.html` principal de SuitOrg
- **Puerto propio:** Express en puerto 3010, frontend servido por Vite/GitHub Pages
- **Comunicación:** Vía URLs externas (links, deep links) o APIs compartidas (Supabase, Stripe)
- **Equipo:** Se mantiene con su propio ciclo de vida (deploy, updates, bugs)

### Condiciones
1. Se registra en `.suit/registry/projects.yaml` con entrada `suit-servihogar`
2. Se documenta como excepción arquitectónica (React permitido para este proyecto)
3. No se crea dependencia con el SPA principal SuitOrg
4. Si en el futuro se necesita integración, se evalúa migrar a vanilla JS

## Consequences

### Positivas
- Lanzamiento inmediato sin retraso de reescritura
- Mantenimiento aislado (bugs en SuitServiHogar no afectan SuitOrg)
- Equipo puede especializarse en React para este proyecto
- MVP funcional genera revenue desde el día 1

### Negativas
- Inconsistencia技术 en el ecosistema SuitOrg (vanilla JS vs React)
- Learning curve para desarrolladores SuitOrg que no conocen React
- Dos stacks de frontend que mantener

### Mitigaciones
- Documentación clara en `AGENTS.md` del proyecto sobre stack y convenciones
- Si se necesita modificar SuitServiHogar, asignar a desarrollador con experiencia React
- Evaluar migración a vanilla JS solo si se justifica (alto tráfico, necesidad de integración profunda)

## References

- Panel Juzgador: Evaluación multi-agente (2026-09-16)
- `.suit/skills/process/panel-juzgador.yaml`
- `SuitServiHogar/Contrato.md`: 41/41 requerimientos funcionales
- `SuitServiHogar/AGENTS.md`: Contexto del proyecto
