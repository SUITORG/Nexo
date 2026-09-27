## Evaluación de Mercado: SuitServiHogar

### Puntuación: 7.5/10

### TAM/SAM/SOM
- **TAM**: ~$259M MXN/año (~$13.3M USD) — Mercado total de servicios de reparación/mantenimiento/limpieza en 216,207 hogares de Reynosa. Basado en gasto promedio estimado $1,200 MXN/hogar/año (extrapolado de mercado MX $6.95B USD / 35M hogares).
- **SAM**: ~$41M MXN/año (~$2.1M USD) — Hogares con internet (52.9% = 114,374) × 30% adopción digital = 34,312 hogares alcanzables.
- **SOM**: Año 1: $205K MXN (0.5% SAM); Año 2: $615K MXN (1.5%); Año 3: $1.23M MXN (3%). Comisión 15% → ingresos plataforma Año 3: ~$185K MXN (~$9.5K USD).
- **Nota**: SOM conservador para entrante sin tracción. Reynosa tiene 704K hab, 216K hogares, ingreso promedio $9.4K MXN/mes formal. Mercado medible y acotado geográficamente (single-tenant).

### Competencia
- **Competidores directos nacionales**: FIXO (escrow 7%/8%, verificación INE+QR, nacional), Mandy (400+ contratistas, 4+ ciudades, tracking tiempo real), Fixi (múltiples cotizaciones, escrow), JUSSY (127 cat, 377 zonas, modelo suscripción sin comisión), ManoRapido (18 países, 100+ ciudades LatAm, 16 categorías).
- **Competidores indirectos**: Habitissimo (2.1M usuarios, enfoque construcción/remodelación), AyudaEnCasa (solo CDMX, WhatsApp-based), directorios locales, Facebook Marketplace/grupos, páginas amarillas.
- **Ventaja competitiva**: Single-tenant Reynosa (foco hiperlocal vs. horizontal nacional), Deep-Vetting presencial (INE + biometría + domicilio vs. solo digital), protocolo PIN antifuga (único), chat restringido a evidencia (reduce fuga), certificación "Técnico Certificado de Confianza" (gamificación de calidad), bimonetario MXN/USD (relevante frontera), donación 1% + redondeo (diferenciación social), 115 técnicos precargados (oferta día 1).
- **Nota**: FIXO es el rival más fuerte (mismo modelo escrow + verificación). JUSSY amenaza con 0% comisión. Ventana: ninguno domina Reynosa específicamente.

### Target
- **Cliente ideal**: Propietarios/arrendatarios en Reynosa (216K hogares), 25-55 años, ingresos medios-altos ($15K+ MXN/mes), con internet (52.9%) y smartphone (93.6%), que valoran seguridad/garantía sobre precio mínimo. Hogares con jefatura femenina (31.5%) son segmento clave (decisión servicios hogar).
- **Tamaño audiencia**: 34K hogares digitalmente activos (SAM). Técnicos: 115 precargados, meta 300-500 activos Año 1. PEA Reynosa 367K, albañiles/afines 50.8K (ENOE 2026-T1) → pool técnico amplio.
- **Nota**: Target claro y segmentable. Frontera Reynosa-McAllen añade dinamismo bimonetario. Riesgo: 27.9% pobreza moderada + 2.86% extrema limita poder adquisitivo en segmentos bajos.

### Timing
- **Tendencia**: Mercado servicios a domicilio online México crece 15.5% CAGR (2026-2034). Penetración internet 72% nacional (2020), 52.9% Reynosa (2020) → brecha de adopción = oportunidad. Urbanización + estilos de vida ocupados + desconfianza informal = drivers.
- **Ventana de oportunidad**: 2025-2027 óptima. Reynosa recibe $3B USD inversión acumulada 48 meses, 8-10K empleos/año, diversificación servicios/comercio/construcción. Ningún player nacional ha "ganado" Reynosa. Post-pandemia aceleró digitalización servicios.
- **Nota**: Timing favorable. Entrada temprana en plaza secundaria no atendida = ventaja first-mover local. Riesgo: inseguridad (narcomenudeo +77.8%, allanamiento +50% oct24-oct25) puede frenar adopción entrada a domicilio.

### Diferenciación
- **Propuesta de valor única**: "Marketplace verificado hyperlocal Reynosa con escrow real, verificación presencial profunda, precios regulados bimonetarios y certificación de confianza ganada por desempeño".
- **Moat**: 1) Deep-Vetting presencial (costo entrada alto, barrera confianza), 2) Red técnicos 115+ día 1 (efecto red inmediato), 3) PIN conformidad + chat solo evidencia (mecánica antifuga propietaria), 4) Certificación "Técnico Certificado de Confianza" (retención oferta), 5) Marca local + causa social (Fundación Hogar Digno).
- **Nota**: No es innovación disruptiva (modelo marketplace + escrow existe), pero ejecución hiperlocal + capas de confianza apiladas = diferenciación defensable en plaza chica. Copia mejorada de FIXO/JUSSY adaptada a contexto fronterizo.

### Fortalezas
- Single-tenant: foco total, sin distracción multi-ciudad
- 41/41 requisitos funcionales implementados, tests passing, CI/CD maduro
- Stack moderno (React 19, Supabase, Stripe Connect, PWA) sin deuda técnica
- 115 técnicos precargados = liquidez oferta día 1
- Modelo comisión 15% split 9%/6% alinea incentivos owner/dev
- Verificación Deep-Vetting + PIN + chat evidencia = capas confianza diferenciales
- Bimonetario MXN/USD nativo (relevante Reynosa-McAllen)
- Causa social integrada (1% + redondeo) → branding + retención

### Riesgos de mercado
- **Competencia nacional con guerra de precios**: FIXO 7%/8% vs 15% SuitServiHogar → presión comisión
- **JUSSY 0% comisión (suscripción)** → modelo alternativo atractivo para técnicos
- **Inseguridad Reynosa**: Allanamiento +50%, narcomenudeo +78% → resistencia entrada técnicos a domicilios
- **Poder adquisitivo**: 27.9% pobreza moderada, 44.3% empleo informal ($6.9K vs $11.4K formal) → sensibilidad precio alta
- **Adopción digital**: Solo 52.9% internet, 34% computadora → brecha adopción app/PWA
- **Fuga de plataforma**: Chat restringido ayuda, pero WhatsApp es rey en MX (93.6% celular)
- **Dependencia Stripe Connect**: Onboarding técnicos fricción alta (KYC, cuenta bancaria)
- **Escalabilidad**: Single-tenant por diseño → replicar a otra ciudad = nuevo tenant (costo)

### Recomendación
- **CONDICIONAL**
- **Condición**: 
  1. Validar sensibilidad precio: test A/B comisión 12% vs 15% primer trimestre
  2. Plan de seguridad técnicos: botón pánico, seguro accidente, zones "no-go" nocturnas
  3. Estrategia anti-fuga WhatsApp: incentivar chat app (gamificación, evidencia automática)
  4. Definir roadmap multi-tenant claro (arquitectura lista, pero go-to-market por plazas)
  5. KPIs mínimos lanzamiento: 50 órdenes/semana mes 3, 200 técnicos activos mes 6, NPS >40