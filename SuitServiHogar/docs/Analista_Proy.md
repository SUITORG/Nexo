# Analista_Proy — SuitServiHogar (Marketplace de servicios para el hogar en Reynosa)

> Consolidado de análisis existentes · **Investigado:** 2026-09-16 (Panel Juzgador) · **Consolidado:** 2026-10-04
> **Fuentes:** `docs/eval_mercado.md`, `docs/eval_tecnico.md`, `docs/eval_riesgo.md`, `docs/eval_financiero.md`, `docs/veredicto.md`, `proposal.md`, `Informe Ejecutivo_ Estrategia y Diseño del Prototipo para ServiciosHogar Reynosa.md`
> **Nota:** análisis original ya realizado por panel de 4 agentes; este documento lo sintetiza para uso como insumo (identidad, contrato, registro). No añade datos nuevos.

## Resumen ejecutivo

**Veredicto: APROBADO CONDICIONAL — 6.93/10.** Marketplace bilateral hiperlocal para Reynosa que conecta hogares con técnicos verificados (Deep-Vetting presencial: INE + biometría + domicilio), con pago en escrow real vía Stripe Connect y PIN de conformidad antifuga. El MVP está **completo y probado** (41/41 requisitos, tests unitarios + E2E, CI/CD, PWA), con 115+ técnicos precargados que resuelven el bottleneck clásico de oferta en marketplaces bilaterales. La tensión del veredicto: producto de alta calidad vs. costo de integración nativa a SuitOrg (~400-600h de reescritura), resuelta con **ADR-029 (micro-frontend aislado con React, excepción a la regla vanilla JS)**.

## Clasificación sugerida

- **Industria:** Hogar y Servicios del Hogar
- **Nicho:** Reparaciones del Hogar (`reparaciones_hogar`) — hermano: limpieza (`limpieza_hogar`)
- **Especialización:** Plomería · Instalaciones eléctricas · Pintura · Carpintería · Aire acondicionado
- **Hipótesis vs hallazgo:** confirmada. Mercado real y acotado; el diferencial no es tecnológico sino de **confianza verificable** (Deep-Vetting + escrow + PIN + tabulador bimonetario).

## Pilar 1 — Fundamentos del mercado

- **TAM** ~$259M MXN/año (216,207 hogares Reynosa, gasto estimado $1,200 MXN/hogar/año). **SAM** ~$41M MXN/año (hogares con internet 52.9% × 30% adopción digital). **SOM** año 1: $205K MXN → año 3: $1.23M MXN.
- **Timing:** mercado de servicios a domicilio online MX crece 15.5% CAGR (2026-2034); ventana 2025-2027; ningún player nacional domina Reynosa (first-mover local).
- **Cohorte clave:** hogares 25-55 años, ingresos medios-altos, jefatura femenina (31.5%) como decisor de servicios del hogar; frontera Reynosa-McAllen justifica el tabulador bimonetario MXN/USD.
- **Oferta:** PEA Reynosa 367K, albañiles/afines 50.8K (ENOE) → pool amplio; 115+ precargados, meta 200 activos mes 6.

## Pilar 2 — Competencia y diferenciación

- **Directos:** FIXO (escrow 7-8%, verificación INE+QR — rival más fuerte), Mandy, Fixi, JUSSY (0% comisión, suscripción), ManoRapido. **Indirectos:** Habitissimo, AyudaEnCasa, directorios, Facebook.
- **Moat (5 capas):** 1) Deep-Vetting presencial (barrera de entrada cara), 2) red 115+ técnicos día 1, 3) PIN conformidad + chat restringido a fotos de evidencia (antifuga propietario), 4) certificación "Técnico Certificado de Confianza" (10 servicios 5★ consecutivos), 5) marca local + causa social (1% + round-up → Fundación Hogar Digno AC).

## Pilar 3 — Modelo económico

- **Comisión:** 15% split 9% dueño / 6% dev (configurable en `sh_config`); volume discount 10% para 20+ servicios/mes con rating >4.7; donaciones 1% plataforma + round-up cliente.
- **Ticket promedio:** ~$850 MXN/servicio. **MRR escenario base:** ~$1,980 USD/mes (3,500 serv/año).
- **Costos fijos:** ~$3,582 USD/mes (Supabase Pro $25, VPS $6, Maps ~$50, dev part-time $3,000, soporte $500). Variable: ~1.5% GMV en Stripe.
- **ROI:** break-even mes 10-11; ROI 12m −44%, ROI 24m +11% (típico de marketplaces two-sided).

## Pilar 4 — Riesgos críticos (los 6 del panel, pre go-live)

1. Deep-Vetting presencial no escalable sin operación física local por ciudad.
2. Fixer.io plan gratis (100 req/mes) insuficiente → contratar plan o migrar a Banxico API.
3. Disputas/chargebacks Stripe sin SLA documentado.
4. Responsabilidad civil por daños en hogar → T&C + seguro RC.
5. Cuota Google Maps sin alerta (80% de $200/mes).
6. Inseguridad Reynosa (allanamiento +50%, narcomenudeo +78%) → botón pánico, seguro accidente, zonas no-go nocturnas.

## Pilar 5 — Cumplimiento SuitOrg (del eval técnico)

Checklist 1.5/6 en su momento → **resuelto por ADR-029**: React 19 permitido (excepción documentada), aislamiento por RLS Supabase (no `id_empresa`), sin GAS ni tablas MASTER, registro en `projects.yaml` con puerto 3010. Pendientes menores del eval: rate FX 18.0 hardcodeado (fallback, Fixer.io es la fuente), IDs secuenciales verificados en flujo de negocio.

## Condiciones del panel (no bloquean construcción; bloquean go-live)

Arquitectura (✅ ADR-029) · Fixer.io/Banxico · SLA disputas + T&C RC · plan seguridad técnicos · alertas Maps · budget marketing $2k USD/mes 6 meses con revisión mes 3 (CAC < $40, matching > 25%, repeat > 30%) · KPIs 50 órdenes/semana mes 3, 200 técnicos mes 6, NPS > 40 · test A/B comisión 12% vs 15% · anti-fuga WhatsApp (chat in-app gamificado).

## Próximo paso

Producción condicionada a cerrar los 6 riesgos críticos. Técnico: ciclo F3 → `docs/VALIDACION.md`.
