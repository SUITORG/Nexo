# SINTESIS_PROYECTO — SuitMisCtas

> Fuente: SuitMisCtas/Analista_Proy.md (investigado: 2026-11-14, 11 fuentes) · Sintetizado: 2026-11-14
> Para qué sirve: documento ejecutivo de referencia para DISEÑAR EL PROTOTIPO de la aplicación.
> Regla: todo hallazgo es rastreable al Analista_Proy.md — nada nuevo, nada inventado.

## 1. Resumen ejecutivo

Viabilidad **media** (como herramienta interna en uso: alta; como producto comercial: media-baja). Mercado de budgeting apps en crecimiento ($1.46B 2025 → $3.25B 2034, CAGR 9.3%) con willingness-to-pay real de $75–109 USD/año, pero océano rojo: incumbents gratis (Rocket Money free, Actual Budget FOSS) y en México el default sigue siendo Excel/Google Sheets. Riesgo #1: **retención por fricción de categorización/mantenimiento** — el usuario abandona cuando el tool se vuelve tarea semanal.

## 2. Patrones comunes del sector

- **El método/propósito vende más que las features:** YNAB retiene por método zero-based; la diferenciación por "categorización automática" es replicable en productos gratis (Analista Pilar 1 + 2).
- **Las alertas de recurrentes/price-hikes son el gancho de conversión** (Rocket Money free tier como puerta de entrada) — mismo job que ya cubren las Alertas de SuitMisCtas (Pilar 2).
- **Local-first + "own your data" es tendencia creciente** (Actual 30.1k★, ahorro de ~$150/año self-hosted vs YNAB) — SuitMisCtas ya vive en ese estado (localStorage) (Pilar 4).
- **Churn estructural a ~6 meses:** incluso productos maduros pierden usuarios por fricción (YNAB 6 meses; Firefly "capable but never opened") (Pilar 3).
- **En MX el usuario default es hoja de cálculo gratis y desconfía del sync bancario** (3 threads r/MexicoFinanciero convergentes) (Pilar 3, señal secundaria).

## 3. Oportunidades detectadas

- **Gastos recurrentes/alertas MX sin agregadores bancarios:** Fintonic degrada (inestabilidad, depósitos en efectivo eliminados) y Wallet no cubre bancos MX — nadie ofrece el job confiablemente en español ([Analista Pilar 3](../Analista_Proy.md)).
- **"Por qué gasté" vs "cuánto gasté":** queja #1 en r/SavingMoney — las apps no capturan contexto/intención (Pilar 3).
- **Estados de cuenta PDF → movimientos:** demanda explícita en r/MexicoFinanciero; oferta casi nula; técnicamente caro/riesgoso (respuesta de la comunidad: "no hay magia") (Pilar 3).
- **Tendencia favorable a lo local-first:** la corriente va hacia el estado actual de SuitMisCtas, no en contra (Pilar 4).

## 4. Funcionalidades recomendadas

| # | Funcionalidad | Prioridad | Respaldada por |
|---|---|---|---|
| 1 | Alertas de vencimientos/saldos (recurrentes) | MVP (ya existe — proteger) | Rocket Money pattern (Pilar 2); job contratado (Pilar 3) |
| 2 | Registro rápido de gastos con cuentas/categorías (baja fricción) | MVP (ya existe — no añadir fricción) | Queja de mantenimiento semanal r/SavingMoney (Pilar 3) |
| 3 | Métrica de uso real del dueño (30 días: aperturas/semana) | MVP (validación) | Siguiente paso del Analista (Veredicto) |
| 4 | Respaldo JSON mensual automatizado | MVP (ya en PENDIENTES) | Churn/riesgo de datos en localStorage (Pilar 3, "back up the data") |
| 5 | Campo "por qué/contexto" opcional en el gasto | fase 2 | Queja #1 r/SavingMoney (Pilar 3) |
| 6 | Importación de estados de cuenta (CSV primero, PDF después) | fase 2 | Demanda explícita r/MexicoFinanciero (Pilar 3) |
| 7 | Vista de MSI/devoluciones MX | futuro | Hueco detectado en r/MexicoFinanciero (Pilar 3, señal secundaria) |
| 8 | Sync bancario / agregador MX | futuro (no prometer) | Failure mode Fintonic (Pilar 3) + sync = feature #1 del sector (Pilar 1) |
| 9 | AI/assistant para preguntar "¿en qué gasté?" | futuro | Tendencia AI en Monarch/FYN (Pilar 4) |

## 5. Perfiles de usuario

1. **El dueño de SuitMisCtas (usuario actual):** job contratado = ver gastos recurrentes + alertas + saldo; prioridad: que el tool no le dé trabajo extra.
2. **El usuario MX manual ("Excel-lover"):** quiere control total, desconfía de sync; ya hace el trabajo en hoja de cálculo — perfil comercial más cercano si algún día se vende (Pilar 4).
3. **El suscriptor cansado de churn:** pagó $84-109/año y abandonó a los 6 meses; valora gratis + método simple (Pilar 4).

## 6. Diferenciadores potenciales

- **Ángulo recomendado:** "Tus finanzas, sin nube ni suscripción: alertas de recurrentes + registro rápido en español, para México" — local-first, cero costo, sin promesas de sync bancario (Pilar 4).
- **Avenidas únicas detectadas:** alertas MX confiables sin agregador (hueco Fintonic/Wallet), contexto "por qué" en el gasto, y futuro parseo de PDFs MX (cuello de botella técnico, no de demanda).

## 7. Conclusiones prácticas para el prototipo

- **Proteger, no reescribir:** el MVP ya existe y está en uso — las 3 funcionalidades MVP son conservación, no construcción (Pilar 2/Veredicto).
- **Cero fricción nueva:** cada feature que añada mantenimiento manual al usuario va en contra del riesgo #1 (r/SavingMoney, churn YNAB).
- **Nunca prometer sync bancario MX** — el failure mode Fintonic destruye confianza más rápido que no tenerlo (Pilar 3).
- **Medir antes de construir:** 30 días de uso real (¿≥3 aperturas/semana? ¿1 vencimiento evitado?) es la validación barata del Veredicto.
- **Si se comercializa:** pasar `micro-app-saas` + `panel-juzgador` antes de código nuevo — mercado local no paga y el diferencial real es la simplicidad (Evidencia desconfirmatoria).
- **Respaldos primero:** localStorage sin servidor = un "clear data" del navegador borra todo (ya en PENDIENTES).
- **Mantener el contrato taxonómico vigente** en la tarjeta (Despachos Contables/Finanzas Personales) hasta decisión de re-clasificación — el Analista sugiere Industria Tecnología/Software si se reevalúa la clasificación (Analista, Clasificación).

## 8. Evidencia desconfirmatoria (no omitir)

- **Océano rojo con gigantes gratis:** Rocket Money free y Actual Budget FOSS cubren el core sin costo; sin sync, SuitMisCtas pierde contra el 85% del mercado que espera bank-sync como feature clave (Analista, Evidencia desconfirmatoria).
- **MX no paga:** 3 threads MX con Excel/Google Sheets como default sugieren willingness-to-pay bajo geográficamente; el mercado que paga ($84-109/año) es US/EU, sin distribución ni sync para SuitMisCtas (mismo).
- **Churn estructural:** YNAB pierde usuarios a los 6 meses; Firefly "never opened" — mantener datos frescos es inherentemente tedioso y aplica a SuitMisCtas (mismo).
- **Sin sync = sin motor de crecimiento del sector:** automatizarlo en MX implica el mismo agregador fallido de Fintonic (mismo).
