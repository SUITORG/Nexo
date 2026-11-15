# Analista_Proy — SuitMisCtas (dashboard de finanzas personales)

> Investigado: 2026-11-14 | Fuentes consultadas: 11

## Resumen ejecutivo

Viabilidad **media**. El mercado de apps de presupuesto existe y crece ($1.46B en 2025 → $3.25B proyectado 2034, CAGR 9.3%) y hay willingness-to-pay real ($75–109 USD/año como tarifa anual de referencia), pero es un océano rojo: incumbents gratis (Rocket Money free tier, Actual Budget FOSS local-first) y en México el usuario default sigue siendo Excel/Google Sheets. SuitMisCtas ya no se valida como idea sino como herramienta en uso: el job (ver mis gastos recurrentes + alertas + saldo) está contratado y cubierto. **Riesgo #1: retención/churn por fricción de categorización** — la evidencia repite que el usuario abandona cuando mantener el categorizado se vuelve tarea semanal.

## Clasificación sugerida

- **Industria:** Tecnología — el producto es software de consumo (app/página de presupuesto), no un servicio contable; compite contra YNAB/Monarch/Rocket Money/Actual, no contra despachos.
- **Nicho:** Software → apps móviles / SaaS (segmento *personal finance / budgeting apps*).
- **Especialización:** finanzas personales **local-first y de baja fricción para México**: registro manual rápido + alertas de vencimientos/saldos, sin depender de agregadores bancarios (que en MX degradan — ver Fintonic) ni de sync US/EU (que en MX falla — ver r/ynab).
- **Hipótesis inicial vs hallazgo:** **cambió** — la hipótesis era *Despachos Contables / Finanzas Personales* (catálogo SuitOS); la evidencia muestra que el TEMA pertenece al mercado de software financiero personal (industria Tecnología), donde la "Finanzas Personales" es el dominio, no el nicho de servicios contables.

## Pilar 1 — Fundamentos expertos del sector

- **Mercado en crecimiento sostenido pero no exponencial:** $1.46B (2025) → $3.25B (2034), CAGR 9.3%, Norteamérica ~66% del mercado ([Dataintelo, Budgeting App Market 2025](https://dataintelo.com/report/global-budgeting-app-market)). Independiente: GVR estima $1.8B (2025) para personal finance software con CAGR 6.6% y fuerte peso de segmento individual ([Grand View Research, 2025](https://www.grandviewresearch.com/industry-analysis/personal-finance-software-market-report)). Dos fuentes confiables, mismo orden de magnitud → decisión: el mercado paga, pero crece a un dígito medio, no es oro.
- **Monetización demostrada:** freemium domina (~50% de la estructura) y ~85% de los usuarios usan bank-sync como feature clave de conversión (Dataintelo). El ancla de precio del sector: **$75–109 USD/año** anual (median ~$84) — ver Pilar 2.
- **Principio innegociable de diseño:** la diferenciación por "categorización automática" es **replicable en productos gratis** — el valor defendible está en método, enfoque (por qué gasté) y confiabilidad, no en features de parsing. La evidencia de usuarios lo confirma (Pilar 3).

## Pilar 2 — Productos de éxito del sector

### YNAB — $109/año (o $14.99/mes), 34-day trial sin tarjeta
- Qué hace bien: método zero-based (cada peso tiene trabajo), comunidad/método como retención, "YNAB Together" hasta 6 personas.
- Patrón replicable: **el método vende, no la app** — el producto enseña un hábito y el usuario se queda por el método.
- Fuentes: [Finpresso pricing 2026](https://finpresso.com/blog/budgeting-app-prices-2026) (verificó páginas oficiales Oct 2026), [SwitchWize comparison](https://www.switchwize.com/learn/ynab-vs-monarch-vs-rocket-money).

### Monarch Money — $99.99/año Core (+Plus $199.99)
- Qué hace bien: bank sync multi-banco, hogares/parejas en un solo plan, forecasting en Plus.
- Patrón replicable: **visión agregada + household**; también: sin sync bancario el producto pierde su razón de ser para su ICP — lo que SuitMisCtas no persigue.
- Fuente: [monarch.com/pricing](https://www.monarch.com/pricing).

### Rocket Money — gratis + Premium "elige tu precio" ($7–14/mes típico)
- Qué hace bien: free tier de tracking de suscripciones/recurrentes; negocio en negociación de cuentas (35–60% del ahorro año 1) y pay-what-you-want.
- Patrón replicable: **las alertas de cargos recurrentes/price-hikes son el gancho** — exactamente el job de las "alertas" de SuitMisCtas.
- Fuente: [Rocket Money cost article](https://www.rocketmoney.com/learn/personal-finance/best-apps-to-manage-recurring-payments) (página oficial, Sep 2026).

### Actual Budget — gratis, open source, local-first (30.1k★ GitHub)
- Qué hace bien: envelope budgeting, todo local con sync opcional E2E, sin suscripción; deployment en un contenedor.
- Patrón replicable: **local-first + "own your data"** es un posicionamiento que crece y es exactamente el estado actual de SuitMisCtas (localStorage).
- Fuentes: [actualbudget.org](https://actualbudget.org/), [GitHub actualbudget/actual](https://github.com/actualbudget/actual).

### Tabla comparativa

| Producto | Precio anual | Free tier | Sync bancario | Enfoque |
|---|---|---|---|---|
| YNAB | $109 | No (34d trial) | Sí (US/CA/UK/EU) | Método zero-based |
| Monarch Core | $99.99 | No (7d trial) | Sí (Plaid/MX/Finicity) | Agregador household |
| Rocket Money | $0–$168 (elige) | Sí | Parcial (premium) | Suscripciones + bills |
| PocketGuard | $74.99 | No (7d trial) | Sí | "Safe to spend" |
| Actual Budget | $0 (FOSS) | Sí | Opcional | Envelope local-first |
| **SuitMisCtas** | **$0 (interna)** | **Sí (es la tool)** | **No (manual + gastos.json)** | **Alertas + gastos recurrentes MX** |

## Pilar 3 — Necesidades reales de los usuarios

### Frustraciones frecuentes
- **La categorización rota y el mantenimiento manual:** "I used to spend about 20 minutes a week cleaning up tags and categories" — el usuario termina haciendo trabajo administrativo que la app prometió eliminar ([r/SavingMoney, 2026](https://www.reddit.com/r/SavingMoney/comments/1trd100/why_do_i_dislike_using_budgeting_apps/)). Frecuencia alta en el thread: no es una queja aislada.
- **"Spreadsheet is not the problem":** los usuarios sienten que las apps los culpan a ellos en vez de darle el *por qué* del gasto — el JTBD real es entender el comportamiento, no solo el balance ([mismo thread r/SavingMoney](https://www.reddit.com/r/SavingMoney/comments/1trd100/why_do_i_dislike_using_budgeting_apps/)).
- **Sync bancario poco confiable en MX/europa no-US:** usuarios de r/ynab prefieren manual entry frente a bridges rotos y banks no soportados ([r/ynab,2025-12](https://www.reddit.com/r/ynab/comments/1pux24w/bank_sync_is_a_mess_why_do_people_still_use/)).

### Lo que piden y no existe
- **Carga automática desde estados de cuenta PDF de BBVA/MX** — pedida explícitamente en r/MexicoFinanciero; la respuesta de la comunidad: "parsear PDFs es un problema sin solución real actualmente" ([r/MexicoFinanciero, 2025-09](https://www.reddit.com/r/MexicoFinanciero/comments/1n5so4s/con_que_app_administran_sus_gastos_personales/)) → hueco real pero técnicamente caro; IA podría resolverlo parcialmente con riesgo de error.
- **Tracking de mes-sin-intereses / devoluciones / MSI mexicanos:** un usuario construyó su propio Jupyter Notebook porque ninguna app lo hace para BBVA ([r/MexicoFinanciero, 2024-09](https://www.reddit.com/r/MexicoFinanciero/comments/1fphm3w/que_app_para_sus_finanzas_personales_usan_o/)) — señal secundaria (thread moderado), pero confirma el hueco MX.
- **Control en pareja/grupo** ([r/MexicoFinanciero, 2025-09](https://www.reddit.com/r/MexicoFinanciero/comments/1njkbw1/aplicaciones_para_controlar_gastos_en_pareja/)) — fuera del alcance actual.

### Quéjas de productos que fracasaron
- **Fintonic (MX/ES):** reviews de 1-3★ concentran inestabilidad del agregador, desaparición de depósitos en efectivo, comunicación opaca y pagos CFE con retardo de 24-72h ([App Store reviews](https://apps.apple.com/mx/app/fintonic/id967989389), análisis [FintechFuturo](https://fintechfuturo.com/fintonic-app/)). Lección: **prometer sync automático en MX y fallar destruye la confianza más rápido que no tenerlo.**
- **Churn temprano incluso en apps buenísimas:** "I lasted about six months with YNAB" — curva de aprendizaje, UI "bland", esfuerzo de aprobación diaria ([r/ynab, 2024](https://www.reddit.com/r/ynab/comments/1e1l97m/i_lasted_about_six_months_with_ynab/)); Firefly III "capable but never opened" por complejidad ([How-To Geek/VDLuz, 2025](https://vdaluz.com/blog/replacing-firefly-iii-with-actual-budget)). **Un tool que el usuario no abre no es un tool.**
- **Wallet by BudgetBakers en MX:** sin soporte de bancos MX y pagos duplicados PayPal ([r/MexicoFinanciero, 2024-09](https://www.reddit.com/r/MexicoFinanciero/comments/1fphm3w/que_app_para_sus_finanzas_personales_usan_o/)).

### Nota de calidad de fuentes
Los threads de r/MexicoFinanciero están por debajo del umbral ideal de engagement (20-40 votos); se incluyen como **señal secundaria** porque no existe alternativa MX de mayor engagement en el cupo, y convergen entre sí (3 threads = frecuencia, no existencia).

## Pilar 4 — Tendencias, oportunidades y posicionamiento

### Tendencias actuales
- **Local-first / self-hosted creciendo como reacción a suscripciones:** "I'm saving nearly $150/year" migrando de YNAB a Firefly III/Actual; categoría activa y en crecimiento en Awesome Self-Hosted ([How-To Geek, 2025-11](https://www.howtogeek.com/self-hosted-open-source-budgeting-software/), [awesomeselfhosted.dev](https://awesomeselfhosted.dev/money-and-budgeting)). SuitMisCtas ya es local-first (localStorage) — la tendencia va *hacia* su estado actual, no en contra.
- **Suscripción-sátira en MX:** usuarios default a Excel/Google Sheets (gratis, control total) — 3 de 3 threads MX relevantes la nombran como opción principal ([r/MexicoFinanciero 2025](https://www.reddit.com/r/MexicoFinanciero/comments/1kgni6l/qu%C3%A9_app_usan_para_trackear_finanzas/)).
- **AI/agents llegando al sector** (MCP de Monarch/FYN, in-app assistants) — fase futura, no MVP.

### Huecos sin cubrir
- **Gastos recurrentes/alertas MX con datos reales sin depender de agregadores:** Rocket Money lo hace bien con sync US; en MX el equivalente confiable no existe (Fintonic degrada, Wallet no cubre bancos MX).
- **"Por qué gasté" sobre "cuánto gasté":** la queja #1 en r/SavingMoney es que las apps no capturan contexto/intención.
- **Estados de cuenta PDF → movimientos:** demanda explícita, oferta casi nula en MX.

### Perfiles de usuario más interesantes
1. **El usuario MX manual (Excel-lover):** quiere control total, desconfía de sync; ya hace el trabajo — SuitMisCtas le ahorra el mantenimiento de la hoja.
2. **El suscriptor cansado de churn:** pagó $84-109/año por apps que abandonó a los 6 meses; valora gratis + método simple.
3. **El dueño de gastos recurrentes (renta, seguros, suscripciones):** su dolor principal es el vencimiento olvidado — el job ya cubierto por Alertas.

### Ángulo diferencial recomendado
**"Tus finanzas, sin nube ni suscripción: alertas de recurrentes + registro rápido en español, para México"** — local-first (ya es), alertas de vencimientos (ya es), cero costo (ya es), sin promesas de sync bancario (evita el failure mode Fintonic).

## Evidencia desconfirmatoria

- **Océano rojo con gigantes gratis:** Rocket Money free tier y Actual Budget FOSS cubren el core sin costo; si SuitMisCtas buscara usuarios externos, su feature set manual (sin sync) pierde contra cualquiera con bank-sync en un mercado donde 85% lo espera como feature clave (Dataintelo + Grand View).
- **MX no paga por estas apps:** la señal de 3 threads MX apuntando a Excel/Google Sheets como default sugiere willingness-to-pay bajo en el nicho geográfico más cercano; el mercado que sí paga ($84-109/año) es US/EU, donde SuitMisCtas no tiene distribución ni sync.
- **Churn estructural del categoría:** YNAB (producto con 15+ años y comunidad) pierde usuarios a los 6 meses por fricción; Firefly nunca se abre. Categorizar y mantener datos frescos es inherentemente tedioso — el riesgo #1 aplica a SuitMisCtas también (el commit pendiente de 2026-11-14 de mejoras de UI sugiere uso activo, pero no mide retención).
- **Bank-sync como feature #1 de conversión:** el estado actual sin sync bancario lo excluye del motor de crecimiento del mercado; automatizarlo en MX implica agregadores con el mismo failure mode de Fintonic.

## Veredicto

- **Viabilidad:** media — como **herramienta interna ya en uso: alta** (job contratado, cero competencia externa relevante para el dueño); como **producto comercial: media-baja** (mercado existe y paga, pero océano rojo, sync imposible de prometer en MX, willingness-to-pay local bajo).
- **Riesgo #1:** retención por fricción de mantenimiento/categorización — el usuario abandona cuando el tool se vuelve tarea semanal (evidencia: r/SavingMoney, churn YNAB, Firefly never-opened).
- **Siguiente paso recomendado:** validación barata = **30 días de uso real del dueño** con métrica simple (¿abre ≥3 veces/semana? ¿alertas evitaron 1 vencimiento?) antes de invertir en features; si algún día se comercializa → pasar por `micro-app-saas` + `panel-juzgador` antes de escribir código nuevo.
