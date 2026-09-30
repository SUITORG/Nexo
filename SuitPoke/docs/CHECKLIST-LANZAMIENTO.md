# CHECKLIST DE LANZAMIENTO — SuitPoke

> **Para qué sirve:** verifica antes de lanzar que funcione, esté medido, respaldado y sea operable. Basado en `GuiaTotal/GUIA.md` §14, adaptado al MVP mínimo exigido por el panel juzgador (6.4/10, APROBADO CONDICIONAL).
> **Audiencia:** quien aprueba el lanzamiento (dev + responsable del proyecto).
> **Versión:** 1.0 · **Fecha:** 2026-09-29

---

## 0. MVP mínimo según panel-juzgador (condiciones de aprobación)

El panel aprobó SuitPoke **solo como MVP acotado** y condicionó una fase 2 a un **gate de medición obligatorio**:

- [ ] **Publicar gratis** en itch.io / Poki u otro host con **HTTPS** (link directo como mínimo)
- [ ] Conseguir **100-300 jugadores reales**
- [ ] Medir: **% que juega ≥2 partidas**
- [ ] Medir: **% de rematch** (los bots malos causan −80 % de rematch según Rockbite)
- [ ] Medir: **D1 retention ≥25 %**
- [ ] Medir: **onboarding completado en <60 s**
- [ ] Si los umbrales se cumplen → fase 2 (progresión/colección); **si no → pivotar, no seguir codificando**

> **Estado: NO INICIADO** — el juego aún no está publicado en ningún host. Este es el bloque que decide si el proyecto sigue.

## Funcionalidad

- [x] Flujo completo de punta a punta probado (local vs IA + online 2 clientes) — `VALIDACION.md` V5, V6
- [x] Datos inválidos probados: código mal formado, sala inexistente/llena/iniciada, token falso (403), turno ajeno, carta inválida — V2, V3
- [ ] Fallos de servicios externos probados — *no aplica (sin servicios externos)*; **sí** falta: caída del servidor a mitad de partida y reconexión del cliente
- [x] Modo offline del shell cacheado verificado (service worker) — V7
- [ ] Flujo completo probado **en móvil real** (pendiente de HTTPS)

## Seguridad

- [x] **Secretos solo en variables de entorno — en realidad: no hay ningún secreto** (condición 6 del contrato: sin claves en cliente) — verificado: `server.js` y cliente no contienen tokens ni API keys
- [x] Roles y permisos verificados **en backend**: iniciar/bots solo con token `creador` (403), acciones solo con token válido (403) — V3
- [x] Validación de entrada en backend: body ≤20 KB, nombres sanitizados (`<>`, ≤16), códigos normalizados, path-traversal bloqueado en estáticos
- [ ] **HTTPS activo y redirección HTTP→HTTPS** — **PENDIENTE** (bloquea instalación PWA en móvil)
- [ ] Rate limiting / antispam en endpoints públicos — *no hay* (ponytail: sin límite de creación de salas por IP)
- [ ] `id_empresa` en toda query si es multiempresa — *no aplica* (sin DB, decisión explícita)

## Medición

- [ ] Conversión/evento principal medido (analytics) — **PENDIENTE**: no hay analytics ni telemetría de uso
- [ ] Errores de producción monitoreados con alerta — **PENDIENTE**: solo `GET /health` y `console.log` de arranque
- [ ] Métricas de negocio del gate (rematch, D1, onboarding <60 s) — **PENDIENTE** (bloque 0)

## Respaldo

- [x] «Backup» de datos + configuración = repositorio git (no hay estado persistente que respaldar; salas en memoria por diseño)
- [x] Restauración probada = `git checkout`/`revert` — aplicable al código, único estado real
- [x] `SuitPoke/VALIDACION.md` con evidencia de la ronda 1

## Documentación

- [x] `MANUAL_CLIENTE.md` actualizado (2026-09-29)
- [x] `MANUAL_PROVEEDOR.md` actualizado (2026-09-29)
- [x] `MANUAL_TECNICO.md` actualizado (2026-09-29)
- [x] `MANUAL_PRUEBAS.md` actualizado (2026-09-29)
- [x] `CONTRATO.md` al día con lo que se lanzó (creado en fase 0)
- [x] `docs/GUIA_JUEGO.md`, `docs/PROMPT_ORIGEN.md`, `README.md` (2026-09-29)
- [ ] `IDENTIDAD_CORPORATIVA.md` — *no aplica* (no hay identidad de marca de cliente; TAXONOMIA.md cubre la clasificación)

## Legal (si recolecta datos personales)

- [x] **No recolecta datos personales**: sin registro, sin cookies de terceros, sin analíticas — solo `localStorage` local (`sp_nombre`, `sp_sonido`)
- [ ] Política de privacidad publicada — *recomendable* aunque sea mínima si se publica en portal (itch.io lo exige)
- [ ] Términos y condiciones publicados — pendiente si se publica externamente
- [x] **Sin marcas de terceros**: nombres, arte y textos 100 % originales (condición 5 panel) — 30 cartas originales, «SuitPoke» propio, sin personajes de Nintendo/Pokémon

## Lo ya cumplido (del MVP)

- [x] **PWA manifest + service worker** — `manifest.webmanifest` (standalone, portrait, es, iconos 192/512/any+maskable) + `sw.js` (cache `suitpoke-v1`, `/api/` siempre a red) — V7
- [x] **Sonido** — 12 efectos WebAudio sin archivos, on/off persistente — V5/V8
- [x] **4 jugadores** — límite duro en servidor (`máx. 4`), bots hasta completar
- [x] **Invite link** — `?sala=CODE` precarga el código; botón «📋 Copiar enlace de invitación»
- [x] **Estado autoritativo en servidor** (condición 3) — motor corre en `server.js`, cliente solo envía intenciones
- [x] **Keep-alive/reconexión SSE** (condición 3) — `retry: 2000` + `: beat` cada 15 s
- [x] **IA con jugadas 100 % legales** (condición 2, parte 1) — `iaJugada` solo devuelve jugadas validadas; 50/50 partidas terminan (V2)
- [x] **Cero dependencias, carpeta aislada, puerto 3014** (condiciones 4, fortalezas)
- [x] **Mazo >20 cartas y >3 elementos** (condición 1 superada: 30 cartas, 6 elementos)
- [x] **Validación con evidencia** (definición de terminado): `VALIDACION.md` PASA 8/8
- [x] **Documentación completa** (pedido del usuario): README, guía, 4 manuales, prompt origen, checklist

## Pendientes concretos (fuera del gate)

| # | Pendiente | Bloque |
|---|---|---|
| 1 | **HTTPS + hosting** con Node ≥18 (habilita instalación PWA en celular y el enlace de invitación público) | Seguridad / Funcionalidad |
| 2 | **Monitoreo de salas**: alertas sobre `Map salas` (memoria), health, errores 500 | Medición |
| 3 | **Idioma EN** — `manifest.lang` y textos solo en español | Internacionalización |
| 4 | **ADR-036** en `.suit/memory/decisions/` | Documentación SuitOS |
| 5 | **Registro en `.suit/registry/projects.yaml`** + fila **3014** en tabla de puertos de `AGENTS.md` | Documentación SuitOS |
| 6 | **Dificultad ajustable de la IA** (condición 2 incompleta) | Funcionalidad |
| 7 | Rate limiting en `/api/crear` | Seguridad |
| 8 | Load-test multi-sala (GAP `VALIDACION.md`) | Funcionalidad |
| 9 | Política de privacidad mínima si se publica en portal | Legal |

---

**Aprobado:** [pendiente] · **Fecha:** [pendiente] · **Commit:** [pendiente]

> El lanzamiento **no puede aprobarse** hasta completar el bloque 0 (gate del panel-juzgador) y el ítem 1 (HTTPS). Todo lo demás es mejora post-gate.
