# Veredicto del Panel Juzgador

## Proyecto: SuitServiHogar

### Resumen Ejecutivo
SuitServiHogar es un marketplace bilateral de servicios para el hogar (plomería, electricidad, pintura, limpieza, etc.) enfocado exclusivamente en Reynosa, Tamaulipas. Se evaluó su integración al ecosistema SuitOrg como nuevo módulo single-tenant con arquitectura React/Supabase/Stripe Connect, diferenciándose por Deep-Vetting presencial, escrow real, PIN antifuga y modelo bimonetario MXN/USD.

### Scores por Dimensión
| Dimensión | Score | Veredicto |
|-----------|-------|-----------|
| Mercado | 7.5/10 | APROBADO CONDICIONAL |
| Técnico | 6/10 | APROBADO CONDICIONAL |
| Riesgo | 7/10 | APROBADO CONDICIONAL |
| Financiero | 7.5/10 | APROBADO CONDICIONAL |
| **TOTAL** | **6.93/10** | — |

**Cálculo ponderado:** (7.5×0.25) + (6.0×0.30) + (7.0×0.25) + (7.5×0.20) = 1.875 + 1.80 + 1.75 + 1.50 = **6.93**

### Análisis Cruzado

**Puntos de acuerdo entre los 4 agentes:**
1. **MVP producción-ready**: 41/41 requisitos funcionales, tests passing, CI/CD, documentación completa.
2. **Supply side resuelto**: 115+ técnicos precargados elimina el bottleneck clásico de marketplaces two-sided.
3. **Diferenciadores defensables**: Deep-Vetting presencial (INE+biometría+domicilio), PIN conformidad antifuga, tabulador bimonetario regulado, certificación "Técnico Certificado de Confianza".
4. **Arquitectura multi-tenant lista** para expandir a Matamoros, Nuevo Laredo, McAllen.
5. **Costos operativos fijos bajos** (~$3.6k/mes) gracias a serverless (Supabase + GAS).
6. **Riesgo crítico compartido**: Deep-Vetting presencial no escalable sin operación física local por ciudad.

**Conflictos y resolución:**
- **Técnico (6/10) vs. Mercado/Financiero (7.5/10)**: Técnico penaliza divergencia de stack (React 19 vs. vanilla JS SuitOrg) y cumplimiento parcial de 6 reglas inmutables (1.5/6). Mercado/Financiero valoran que el código ya existe y funciona. **Resolución**: El peso técnico (30%) refleja que la integración nativa a SuitOrg costaría ~400-600h de reescritura. La alternativa aceptada por Financiero es operar como submódulo independiente (micro-frontend en `#servihogar` vía ES module/iframe) manteniendo React internamente — requiere ADR de excepción arquitectónica.
- **Riesgo (7/10) identifica 6 riesgos críticos** que Finanzas condiciona a resolver pre go-live (Fixer.io plan pago/Banxico, proceso disputas Stripe, T&C responsabilidad civil). **Resolución**: Condiciones financieras y de riesgo se alinean; se consolidan en la sección de condiciones.

### Condiciones (APROBADO CONDICIONAL)

1. **Arquitectura**: Definir path de integración a SuitOrg vía ADR — either (a) reescritura frontend a vanilla JS SPA + hash routing `#servihogar` + migración RLS→`id_empresa` + **registro `projects.yaml` puerto 3014**, **o** (b) operar como micro-frontend aislado montado en `#servihogar` (excepción arquitectónica documentada; **no usa GAS ni tablas MASTER; multi-tenant via Supabase RLS**).
2. **Fixer.io / Tipo de cambio**: Contratar plan pago Fixer.io **o** migrar a Banxico API (gratis, oficial) antes de go-live productivo.
3. **Stripe Connect**: Documentar SLA y proceso de resolución de disputas/chargebacks; añadir T&C cobertura responsabilidad civil daños en hogar del cliente.
4. **Seguridad técnicos**: Implementar botón pánico, seguro accidente, zonas "no-go" nocturnas en Reynosa (allanamiento +50%, narcomenudeo +78% oct24-oct25).
5. **Google Maps**: Monitoreo de uso con alerta al 80% de cuota gratuita ($200/mes ≈ 11k calls); cache geocoding + fallback OpenStreetMap.
6. **Marketing launch**: Budget mínimo $2,000 USD/mes (Meta/Google Ads geo-targeted Reynosa + referidos) primeros 6 meses. Revisión mes 3: CAC < $40, matching rate > 25%, repeat rate > 30%. Si no se cumple, pivot a lead-gen model (cobrar lead a técnicos).
7. **KPIs mínimos lanzamiento**: 50 órdenes/semana mes 3, 200 técnicos activos mes 6, NPS > 40.
8. **Validación precio**: Test A/B comisión 12% vs 15% primer trimestre (FIXO 7-8%, JUSSY 0% suscripción).
9. **Anti-fuga WhatsApp**: Incentivar chat in-app (gamificación, evidencia automática) — WhatsApp 93.6% penetración en MX.

### Próximos Pasos
- [ ] Redactar ADR-XXX documentando excepción arquitectónica: micro-frontend aislado en `#servihogar` (no usa GAS ni tablas MASTER; multi-tenant via Supabase RLS) con approval de Architect
- [ ] Contratar Fixer.io plan pago o implementar Banxico API (1 semana)
- [ ] Documentar proceso disputas Stripe + T&C responsabilidad civil + seguro RC técnicos (2 semanas)
- [ ] Diseñar plan seguridad técnicos: botón pánico, seguro, zonas no-go (2 semanas)
- [ ] Configurar alertas Google Maps 80% cuota + implementar cache geocoding
- [ ] Preparar campaña launch $2k/mes + referidos; definir métricas mes 3
- [ ] Ejecutar test A/B comisión 12% vs 15% primer trimestre
- [ ] Implementar incentivos chat in-app anti-fuga

---

## VEREDICTO: **APROBADO CONDICIONAL**

El proyecto tiene MVP sólido, supply side resuelto, diferenciadores defensables y unit economics viables a 24 meses (ROI +11%). La puntuación 6.93/10 refleja tensión entre calidad del producto actual (alto) y costo de integración nativa a SuitOrg (alto). La condición principal es definir vía ADR si se reescribe a vanilla JS para integración nativa o se opera como micro-frontend con excepción arquitectónica; el resto de condiciones son mitigaciones de riesgo operativas/financieras estándar para go-live en mercado fronterizo de alta inseguridad.