## Evaluación Financiera: SuitServiHogar

### Puntuación: 7.5/10

### Costo de Desarrollo
- **Horas estimadas**: 480-620 horas (ya invertidas: ~500h según estado actual 41/41 requisitos)
- **Costo (si se externaliza)**: $72,000 - $93,000 USD (tarifa $150/h senior full-stack)
- **Costo (si se hace in-house)**: $35,000 - $45,000 USD (2 devs senior 3 meses, costo interno ~$12k/mes cada uno)
- **Nota**: El proyecto reporta 41/41 requisitos funcionales implementados, tests passing, CI/CD, PWA, documentación completa. El costo hundido ya está pagado. El análisis se enfoca en costos marginales futuros (mantenimiento, escalamiento, marketing).

### Costo de Operación (mensual)
- **Infraestructura**:
  - Supabase (Pro plan): $25 USD/mes (DB + Auth + Realtime + 8GB storage)
  - VPS Express.js (Stripe webhooks): $6 USD/mes (Hetzner CX21 o similar)
  - GAS: $0 (cuota gratuita Google Workspace)
  - Dominio + SSL: $1 USD/mes
- **APIs/servicios externos**:
  - Google Maps API: ~$50 USD/mes (estimado 10k requests/mes @ $5/1k)
  - Fixer.io: $0 (plan gratuito 100 req/mes) o $14 USD/mes (plan pago)
  - Stripe Connect: 0.25% + $0.25 MXN por transacción exitosa (costo variable, no fijo)
- **Soporte/mantenimiento**:
  - 1 dev part-time (20h/mes): $3,000 USD/mes (tarifa interna)
  - Soporte cliente nivel 1 (outsourced): $500 USD/mes
- **Total mensual fijo**: ~$3,582 USD/mes
- **Total mensual variable (Stripe)**: ~1.5% GMV
- **Nota**: Costos fijos bajos gracias a arquitectura serverless (Supabase + GAS). El mayor costo es personal técnico. Google Maps es el único costo externo significativo fijo.

### Revenue Potencial
- **Modelo de monetización**: Comisión 15% por transacción (split 9% owner / 6% dev). Volume discount 10% (neto 13.5%) para técnicos top (20+ servicios/mes, rating >4.7). Donaciones 1% plataforma + round-up cliente.
- **Ticket promedio estimado**: $850 MXN/servicio (~$47 USD @ 18.0 MXN/USD) — basado en plomería/electricidad/pintura en Reynosa
- **Clientes potenciales (año 1)**:
  - Reynosa metro: ~850k hab, ~280k hogares
  - TAM servicios hogar/año: ~$45M USD (INEGI + estimación local)
  - SAM (alcanzable año 1, 3% penetración): ~1,350 clientes activos, 3,500 servicios/año
  - SOM (conservador): 400 clientes, 1,000 servicios/año
- **MRR estimado**:
  - Conservador (1,000 serv/año @ $47 * 15%): $5,875 USD/año → **$490 USD/mes**
  - Base (3,500 serv/año @ $47 * 14.5% avg): $23,757 USD/año → **$1,980 USD/mes**
  - Optimista (8,000 serv/año @ $55 * 14%): $61,600 USD/año → **$5,133 USD/mes**
- **Nota**: El revenue depende críticamente de adquisición de clientes (demanda), no de oferta (115 técnicos precargados ya existen). CAC estimado $25-40 USD/cliente via Meta/Google Ads local.

### ROI
- **Break-even**: Mes 8-12 (escenario base)
  - Inversión recuperable (costos marginales año 1): ~$43k USD (dev + marketing + ops)
  - Revenue año 1 base: ~$23.8k USD → déficit año 1: ~$19k USD
  - Año 2 proyectado (2x crecimiento orgánico + referidos): ~$47.5k USD revenue
  - Break-even acumulado: Mes 10-11
- **ROI a 12 meses**: -44% (pérdida neta ~$19k USD)
- **ROI a 24 meses**: +11% (ganancia neta ~$4.5k USD acumulada)
- **Nota**: ROI negativo año 1 es típico en marketplaces two-sided. El inflection point depende de liquidity (matching tasa >30%). Programa de referidos ($150/$100 MXN) acelera lado oferta/demanda pero impacta margen corto plazo.

### Alternativas
- **Comprar solución existente**:
  - Sharetribe Go: $299/mes + 1-2% transacción → $3,600/año fijo + revenue share. Time-to-market: 2 semanas. No control sobre Deep-Vetting, escrow Stripe Connect, tabulador bimonetario, PIN conformidad.
  - Arcadier: $500+/mes, enterprise. Overkill para single-city.
  - **Veredicto**: Comprar ahorra 6-9 meses dev pero sacrifica diferenciadores clave (Deep-Vetting, PIN, tabulador MXN/USD, certificación "Técnico Certificado"). No recomendado para MVP validado.
- **Adaptar módulo existente (SuitOrg)**:
  - SuitCotizador + SuitReservaciones + SuitPos → ensamblar marketplace. Requiere 200-300h integración + adaptar Stripe Connect + Deep-Vetting.
  - Ahorra ~40% vs build from scratch. Reutiliza auth, multi-tenant, RBAC, Supabase schema patterns.
  - **Veredicto**: Recomendado como path forward para v2 multi-ciudad. Para Reynosa v1, el código actual ya está listo.
- **No hacer nada**: Costo oportunidad = dejar 115 técnicos precargados sin monetizar + mercado $45M/año sin capturar. No viable estratégicamente.

### Fortalezas
- Código producción-ready (41/41 reqs, tests, CI/CD, docs) → riesgo técnico bajo
- Diferenciadores defensables: Deep-Vetting presencial, PIN conformidad antifraude, tabulador bimonetario regulado, escrow real Stripe Connect
- Costos operativos fijos bajos ($3.6k/mes) → apalancamiento operativo alto
- Modelo commission-only alinea incentivos (plataforma gana solo si técnico gana)
- 115 técnicos precargados = supply side resuelto (bottleneck clásico marketplaces)
- Programa referidos viraliza adquisición ambos lados
- Arquitectura multi-tenant lista para expandir a otras ciudades (Matamoros, Nuevo Laredo, McAllen)

### Riesgos financieros
- **Demanda (CAC > LTV)**: Si CAC > $60 USD/cliente y retención < 3 servicios/año, unit economics fallan. Mitigación: referidos orgánicos + SEO local + alianzas ferreterías/constructores.
- **Concentración geográfica**: Single-city (Reynosa) limita TAM. Expansión multi-ciudad requiere replicar Deep-Vetting presencial (costo $2-3k/ciudad).
- **Stripe Connect dependency**: Cambios en terms/fees/countries supported afectan directamente revenue. Mitigación: abstracción payment provider en código.
- **Google Maps cost spike**: Si usage crece 10x, Maps API pasa de $50 a $500/mes. Mitigación: cache geocoding + OpenStreetMap fallback.
- **Seasonality**: Servicios hogar caen nov-ene (fiestas) y jul-ago (vacaciones). Cash flow management crítico.
- **Chargebacks/fraude**: Escrow reduce pero no elimina. Reserva 2% GMV para disputas.
- **Regulatorio**: SAT facturación 4.0, PROFECO, leyes consumidor. Cumplimiento requiere legal review ($3-5k once).

### Recomendación
- **APROBADO CONDICIONAL**
- **Condición**: Lanzar con budget marketing mínimo $2,000 USD/mes (Meta/Google Ads geo-targeted Reynosa + referidos) durante primeros 6 meses. Revisar métricas mes 3: CAC < $40, matching rate > 25%, repeat rate > 30%. Si no se cumple, pivot a lead-gen model (cobrar lead a técnicos) en lugar de marketplace full escrow.