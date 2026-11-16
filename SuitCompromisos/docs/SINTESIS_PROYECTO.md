# SINTESIS_PROYECTO — SuitCompromisos

> Fuente: SuitCompromisos/Analista_Proy.md (investigado: 2026-11-16, 12 fuentes) · Sintetizado: 2026-11-16
> Insumos adicionales: proposal.md (estado real del código 2026-11-03) · panel-juzgador: APROBADO CONDICIONAL 6.75
> Para qué sirve: documento ejecutivo de referencia para DISEÑAR EL PROTOTIPO de la aplicación.
> Regla: todo hallazgo es rastreable al Analista_Proy.md — nada nuevo, nada inventado.

## 1. Resumen ejecutivo
Viabilidad **MEDIA**: alta como herramienta personal (ya construida, puente Calendar en uso), media-baja como producto comercial. La categoría task management mueve ~USD $4.5B en 2026 (CAGR 15.6%) pero está saturada con gigantes gratuitos. El hueco real detectado es la **integración tarea↔calendario bidireccional sin suscripción ni nube**, que los líderes descuidan. **Riesgo #1: retención del rubro (4.1% a D30 en productividad) — el valor depende del uso diario propio, no de más features.**

## 2. Patrones comunes del sector
- **Integración con calendario/email = retención:** churn 40–60% menor que las apps standalone (RetentionCheck 2026).
- **Complejidad mata usage:** "too complex/overwhelming" = 20% de cancelaciones; 42.9% de reseñas negativas de Asana por UI/confusión (paper ACM 2024).
- **Free tier suficiente = churn:** 26% de cancelaciones se van porque "lo gratis alcanza" — el precio personal contra Google Tasks gratis es batalla perdida.
- **Datos acumulados = lock-in:** 6+ meses de tareas usadas reducen el churn a la mitad (RetentionCheck).
- **Captura rápida + primer check-off en la primera sesión** son el "aha moment" del rubro (FoxData); las tareas se anotan rápido pero 41% nunca se completa (WIRED).

## 3. Oportunidades detectadas
- **Tarea↔evento bidireccional sin pago:** dolor activo documentado en r/todoist tras eliminar Todoist su sync legado (2025) y en r/ticktick pidiendo "calendario, no AI" — SuitCompromisos ya lo resuelve vía `suitId` + service account (Pilar 3).
- **Life admin personal** (viajes, pagos, entregas): los incumbents optimizan work, no compromisos de vida (Pilar 4, huecos sin cubrir).
- **Local-first como dirección del sector:** workspaces personales en la propia máquina (señal 2026, fuentes secundarias marcadas débiles) — ya es la arquitectura actual.
- **Mercado en crecimiento** $4.5B → $12.3B a 2033 (Grand View vía selfmanager.ai) pese a saturación.

## 4. Funcionalidades recomendadas
| # | Funcionalidad | Prioridad | Respaldada por |
|---|---|---|---|
| 1 | Sync tarea↔evento Google Calendar bidireccional sin duplicados (suitId) — mantener y endurecer | MVP | r/todoist + r/ticktick (P3); churn 40-60% menor con calendario (P1) |
| 2 | Medir uso real propio 30 días (syncs/mes, tareas creadas/hechas) — no construir antes medir | MVP | Veredicto: siguiente paso; retención 4.1% D30 (P1) |
| 3 | Captura en <10s + marcar hecho en 1 clic (ya existe: conservar) | MVP | FoxData aha-moment (P1) |
| 4 | Backup/export JSON automático ya existe — extenderlo a respaldo periódico de config+credenciales | MVP | Local-first: datos solo en navegador; evidencia de riesgo de pérdida (§8) |
| 5 | Tipos personales de compromiso (viaje/pago/reunión/entrega) — ya existe: no "trivializar" a lista genérica | fase 2 | Hueco life admin (P4) |
| 6 | Simplificar: una sola pantalla de trabajo diaria, evitar paneles que inviten a re-diseñar workflow | fase 2 | "Pierdo más tiempo re-diseñando" (P3); too complex = 20% churn (P1) |
| 7 | Vista "semana en el calendario" embebida (solo lectura del espejo Calendar) | fase 2 | Dolor tarea↔evento (P3); patrón TickTick (P2) |
| 8 | Nota de estado del puente (SA activa, último sync, errores visibles) — ya existe vía /api/status: mostrarlo siempre | fase 2 | SPOF aceptado, panel condicional 6.75 |
| 9 | Multiusuario / cuentas / hosting | futuro | Requisito si algún día se comercializa (§8) |
| 10 | AI (captura por voz, sugerencias) | futuro | Tendencia incumbents (P4) — no competir aquí ahora |

## 5. Perfiles de usuario
1. **El dueño (uso actual):** un solo usuario, life admin en Google Calendar, ya opera el puente a diario — motivación: no depender de exportar `.ics` a mano (proposal.md).
2. **Churners de Todoist/TickTick:** pagan por tareas pero cancelan por el calendario (r/todoist, 2025) — motivación central: sync bidireccional fiable.
3. **Usuario casual de life admin** en Google Calendar que quiere pendientes ahí — pero hoy lo resuelve con Google Tasks gratis (§8).
*(Los perfiles 2–3 solo aplican si se decide comercializar; el análisis marca eso como pendiente de validación.)*

## 6. Diferenciadores potenciales
- **Ángulo recomendado:** "Tus compromisos, en tu calendario, sin nube ni mensualidad" — local-first + service account + tipos personales.
- **Avenidas únicas detectadas:** (a) mercado sin buen sustituto del sync legado de Todoist; (b) life admin como nicho no atendido por incumbents; (c) privacidad/local-first en auge pero con evidencia aún débil de demanda.

## 7. Conclusiones prácticas para el prototipo
- **Primero medir, luego construir:** 30 días de uso propio (syncs/mes, artículos hechos) antes de cualquier feature nueva.
- **El sync Calendar es el producto** — cualquier cambio debe preservar la invariante `suitId` sin duplicados (contrato pendiente de creación).
- **No competir en features ni AI** contra Todoist/TickTick; competir en cero-coste + local + tipos de life admin.
- **Simplicidad por encima de todo:** evitar paneles de configuración que inviten al "workflow redesign" (causa #1 de abandono reportada).
- **SPOF laptop/SA es condición aceptada** (panel 6.75 condicional): documentar visiblemente el estado del puente, no ocultarlo.
- **Validación barata:** encuesta a 3–5 personas de life admin sobre disposición a pagar por el puente Calendar sin nube — si no hay tracción, mantenerla solo como herramienta interna.
- **Si se comercializa:** el diseño multiusuario/hospedaje es un rehacer, no un incremental — presupuestarlo como proyecto aparte.

## 8. Evidencia desconfirmatoria (no omitir)
1. **Google Tasks gratis ya vive en Google Calendar** — el caso de uso básico no tiene precio que batir (Zapier/Wirecutter, P2).
2. **Retención del rubro pésima:** 4.1% D30, churn 55.2%/año (FoxData/RetentionCheck, P1) — aun el producto perfecto pelea contra el abandono estructural de la categoría.
3. **Público actual = 1 usuario** — no hay mercado tal como está planteado; comercializar exige re-diseño total (multiusuario, móvil, hosting).
4. **SPOF: laptop encendida + SA compartida** — fricción de setup que la competencia cloud no tiene (condición 5 del panel-juzgador).
5. **Incumbents ya avanzan en AI+MCP** (TickTick MCP, Todoist Assist, P4) — la ventana de "simplicidad diferencial" se estrecha.
