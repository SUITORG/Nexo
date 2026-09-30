# PROMPT ORIGEN — SUITPOKE

> Generado desde: GuiaTotal/prompts/PROMPT_ORIGEN.md · 2026-09-29 · Versión: 1.0
> Actualizado por: /guia-total origen (última pasada: 2026-09-29)

> **Para qué sirve:** prompt vivo que describe el origen y contexto del proyecto — de dónde sale, para quién es, cómo trabaja su dueño y qué reglas de comunicación/entrega tiene. Se usa como insumo de contexto al retomar SuitPoke.
> **Regla de vida:** esta instancia vive en `SuitPoke/docs/PROMPT_ORIGEN.md`; la plantilla maestra en `GuiaTotal/prompts/PROMPT_ORIGEN.md` solo cambia cuando cambia la metodología.

---

## Instrucción base (bloque para copiar a una IA)

```text
[ROL Y CONTEXTO DEL PROYECTO]

Proyecto: SuitPoke — juego de cartas PvP (battler) en navegador para 2-4 jugadores,
salas online por código de invitación, oponentes IA, sonido y PWA instalable.
Origen: el usuario pidió EMULAR las mecánicas de cartas tipo Pokémon (elementos,
ventajas, partidas cortas) SIN copiar marcas ni personajes: multijugador en el
celular vía enlace, sonido, y llevarlo hasta la documentación completa.
Etapa actual: construcción/mantenimiento — MVP funcional y validado (ronda 1 PASA),
falta publicar y medir (gate de 100-300 jugadores) + trámites SuitOS pendientes.

CONTEXTO DE DATOS
- Motor de datos: NINGUNO. Decisión explícita del usuario (2026-09-29): SuitPoke queda
  fuera del ramal Sheets/Supabase/Brief — no consume Config_Empresas ni db_engine.
- Estado de partida/salas: en memoria del servidor (se pierde al reiniciar).
- Artefactos vivos: docs/CONTRATO.md (alcance), docs/TAXONOMIA.md (Industria/Nicho: Otros),
  Analista_Proy.md (viabilidad MEDIA), VALIDACION.md (evidencia V1-V8 PASA),
  CORRECCIONES.md (7 aprendizajes), panel juzgador APROBADO CONDICIONAL 6.4/10.

CÓMO TRABAJA EL DUEÑO
- Prefiere documentación en archivos .md con nombres cortos que se puedan consultar
  para recordar para qué sirve cada cosa (README, guías, manuales, contrato, validación).
- Necesita respuestas directas, sin rodeos, y ejemplos concretos antes que teoría.
- Pide desglose de solicitudes en archivos .md cuando el tema es grande.
- Quiere TODO en español: código, textos de UI, cartas y documentación.

REGLAS DEL PROYECTO (de SuitPoke/docs/CONTRATO.md)
1. Vanilla JS en frontend, sin frameworks (regla inmutable #7 AGENTS.md raíz).
2. Cero dependencias npm dentro de SuitPoke/.
3. Nombres, arte y textos 100% originales — emular mecánicas TCG, NO marcas de
   Nintendo/Pokémon (condición panel-juzgador).
4. Estado de partida autoritativo en servidor: el cliente nunca calcula resultados oficiales.
5. PWA instalable (manifest + service worker); offline funciona local/IA, online requiere servidor.
6. Sin claves ni secretos en el cliente; sin service_role ni tokens.
- Límites: puede modificar SuitPoke/**; para el alta: .suit/registry/projects.yaml,
  .suit/memory/decisions/ (ADR), AGENTS.md (tabla de puertos), GuiaTotal/registro/suitpoke.yaml.
  No tocar: server.js raíz, backend/, otros subproyectos, .github/workflows/.

AGENTES / SKILLS QUE AYUDAN A AVANZAR MÁS RÁPIDO
- ciclo — mantenimiento por fases con commits y validación.
- guia-total — manuales, prompt origen, checklist de lanzamiento (esta instancia).
- ponytail — el código está escrito en modo lazy: cero deps, stdlib, sin abstracciones.
- panel-juzgador — evaluación multi-agente (ya ejecutada: APROBADO CONDICIONAL 6.4/10).
- Ver GuiaTotal/MAPA.md para el árbol completo de triggers.

QUÉ DOCUMENTAR CUANDO HAY CAMBIOS
- Actualizar esta instancia si cambió la etapa o las reglas.
- Actualizar manuales si cambió UI/backend (ver /guia-total manuales).
- Actualizar VALIDACION.md con la nueva evidencia y CORRECCIONES.md con aprendizajes.
```

## 1. Idea original del usuario

Pedimento textual del usuario (2026-09-29), reconstruido de `Analista_Proy.md`, `docs/CONTRATO.md` y el veredicto del panel juzgador:

- **Emular Pokémon con cartas** — replicar las *mecánicas* de un TCG/battler (elementos, poder/defensa, ventajas, partidas cortas), **sin copiar** marcas, nombres ni personajes: arte y nombres 100% originales.
- **Multijugador** — 2-4 jugadores en tiempo real, salas por **código de invitación / enlace** (patrón «crea sala → comparte link → juega en 10 segundos»).
- **En el celular, como app** — PWA instalable (manifest + service worker), vertica, sin instalar desde tiendas.
- **Con sonido** — efectos en el juego.
- **Guía completa hasta documentación** — llevar el proyecto completo: analista → panel juzgador → contrato → código → validación → manuales → prompt origen → checklist de lanzamiento.

## 2. Decisiones tomadas

| # | Decisión | Origen |
|---|---|---|
| 1 | **Sin Sheets/Supabase/Config_Empresas** — sin DB, estado en memoria | Decisión explícita del usuario (2026-09-29); fuera del ramal multi-tenant |
| 2 | **Online por SSE** (`text/event-stream`), no WebSocket | Criterio propio del build: suficiente para turnos, cero dependencias, reconexión nativa (`retry: 2000`) |
| 3 | **Cero dependencias npm** — Node stdlib + vanilla JS | Contrato: invariante 2; condición panel «cero costo operativo» |
| 4 | **Motor compartido servidor/cliente** (`js/motor.js` UMD-lite) | Condición panel: estado autoritativo en servidor; permite offline local con la misma lógica |
| 5 | **6 elementos en anillo** (fuego→planta→agua→rayo→tierra→fantasma) con +3/−2 | Equilibrio simétrico que sustituye al «matchmaking injusto» (dolor #2 del sector) |
| 6 | **6 elementos y 30 cartas** en vez de los 3 elementos/~20 del MVP mínimo del panel | Se construyó el techo del MVP acotado, no el piso |
| 7 | **Puerto 3014** y carpeta aislada `SuitPoke/` | Patrón monorepo; 3014 estaba libre (condición 4 del panel) |
| 8 | **Sin progresión/colección/monetización en v1** | Condición 1 del panel (MVP acotado ~80 h) |
| 9 | **IA por score heurístico** (daño esperado, remate +100, escudo de fallback) | Condición 2: jugadas 100% legales; *dificultad ajustable queda pendiente* |
| 10 | **Documentación completa en español** | Pedido explícito del usuario |

## 3. Estado actual

**Funcional y validado (Ronda 1 — `VALIDACION.md`, 2026-09-29, veredicto PASA 8/8):**

- ✅ Motor: 15 HP, mano 5/máx 7, robo 1/turno, anillo de 6 elementos +3/−2, daño directo ≤7, vs guardia ≤6, crítico ≤9, retroceso 1, guardia propia tras atacar, recicla descarte, 30 cartas, 3 habilidades (🛡💥🤲).
- ✅ Servidor de salas en `server.js` (puerto 3014): `/api/crear`, `/api/unirse`, `/api/accion`, `/api/stream`, `/health`; tokens de 16 chars; sala máx. 4; anfitrión único para iniciar/bots.
- ✅ Online en vivo por SSE con vistas filtradas (nadie ve la mano ajena).
- ✅ Modo vs IA local 1-3 bots, offline vía service worker.
- ✅ PWA: manifest + SW + iconos 192/512 + botón instalar.
- ✅ Sonido WebAudio: 12 efectos, on/off persistente.
- ✅ Enlace de invitación `?sala=CODE` que precarga el código.
- ✅ 4 suites de test + 50 partidas simuladas que siempre terminan con 1 ganador.

**Pendientes (marcados, no inventados):**

| Pendiente | Referencia |
|---|---|
| **Gate de medición**: publicar gratis (itch.io/Poki u otro host con HTTPS), 100-300 jugadores reales, medir ≥2 partidas, % rematch, D1 ≥25%, onboarding <60 s | Condición 6 panel-juzgador; `Analista_Proy.md` «Siguiente paso» |
| **HTTPS/hosting** para instalación móvil real (GAP de `VALIDACION.md`) | `VALIDACION.md` GAPs |
| **ADR-036** (exención multi-tenant/sin DB) — no escrito | Condición 4 panel; `MANUAL_TECNICO.md` §10 |
| **Registro en `.suit/registry/projects.yaml`** + fila 3014 en `AGENTS.md` | Idem |
| **Dificultad ajustable de la IA** (condición 2) — hoy solo hay una heurística | Condición 2 panel |
| **Monitoreo de salas/retención** (hoy solo `/health` + barrido probabilístico) | `MANUAL_TECNICO.md` §9 |
| **Idioma EN** — la PWA está solo en `es` (`manifest.lang`, textos) | Nuevo |
| **Progresión/colección** (fase 2, tras pasar el gate) | Condición 1 y 6 panel |
| Load-test con múltiples salas | GAP `VALIDACION.md` |

## 4. Reglas de comunicación / entrega (heredadas del dueño)

- Responder directo, mínimo contexto por defecto (`respuestas-minimas`).
- Confirmar antes de modificar algo existente si la certeza es <95 %.
- Commits con formato SuitOS: `{emoji} {tipo}: {desc} (v{X.Y.Z})`.
- Validar antes de dar por terminado: `node --check` + `test/motor.test.js` + smoke.

## Cambios de metodología (esta instancia)

- 2026-09-29: creación inicial desde `GuiaTotal/prompts/PROMPT_ORIGEN.md` en fase de documentación de SuitPoke.
