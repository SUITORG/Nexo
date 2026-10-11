# BRIEF CLIENTE IDEAL — ContractRenew

> **Tipo:** brief local de producto propio (NO es brief de tenant).
> **Regla:** este producto **no existe en `Config_Empresas`** → `id_empresa: null`. No usar `empresa-mascara` ni la cadena clusters-seo/paginas-seo.
> **Estructura:** 21 segmentos de brief-engine v1.0 (`be-001..be-021`), semáforos de confianza `[A]` (dato duro) / `[B]` (investigado) / `[C]` (asumido).
> **Insumos:** `MANUAL_VENTAS.md` (ICP, precios, objeciones, scripts), corrida ideas-saas 2026-10-10b (panel 7.8), mercado 118k talleres HVAC (US).
> **Generado:** 2026-10-10 · **Motor:** brief-engine (adaptado local, sin fila Sheets)

---

## Segmentos (orden be-001..be-021)

| # | Segmento | Valor | Conf. |
|---|---|---|---|
| 1 | industria | Software B2B / SaaS de gestión para oficios y servicios | A |
| 2 | nicho | Talleres HVAC (calefacción/aire acondicionado), plomería y eléctrica con contratos de mantenimiento anual | A |
| 3 | especializacion | Contratos de mantenimiento anual (2 visitas + prioridad) y alertas de renovación 60 días antes | B |
| 4 | vendes | SaaS de registro de contratos de mantenimiento + alerta de vencimientos: "el 20% que protege el 80% del ingreso recurrente de la tienda" | A |
| 5 | audiencia | Dueños de talleres de 1-5 técnicos (118k talleres HVAC solo en US) que llevan los contratos en Excel, carpeta de papel o la memoria del dueño; $200-500/mo de software enterprise no les sirve | A |
| 6 | dolor | 1) No saber cuántos contratos tienen activos ni cuándo vence cada uno. 2) Cada renovación que se pasa = $600-2,000/año de ingreso garantizado perdido. 3) Excel no le avisa; el aviso ES el producto | B |
| 7 | PBP | Promesa: nunca más se te pasa una renovación — aviso 60 días antes de cada vencimiento. Beneficio: ingreso recurrente protegido por menos que un servicio de emergencia al mes ($0.97/día) | B |
| 8 | lograr | Suscripción activa con contratos cargados y reporte de vencidos/próximos 60 días revisado semanalmente | A |
| 9 | vivir | Landing propia (puerto 3017) + prospección directa por WhatsApp/visita con script (sin marketplaces ni ads en MVP) | B |
| 10 | LAPVTFU | `[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo]` | — |
| 11 | PM | Plan Taller $29/mo (1-25 contratos, alertas 60d) · Plan Crew $49/mo (ilimitado + reporte mensual de ingreso recurrente); infra MVP Express+SQLite ≈ <$5/mes → margen >85% [hipótesis, validar con hosting real] | B |
| 12 | objecion | 1) "Lo tengo en Excel" → Excel no le avisa. 2) "Muy caro" → $0.97/día; un contrato perdido = $600-2,000/año. 3) "Somos muy pocos" → justamente para eso: los grandes ya tienen su sistema. 4) "¿Qué necesito?" → nombre del cliente y fecha de renovación. Nada más | A |
| 13 | competidores | ServiceTitan $200-500/mo (enterprise) · Housecall Pro $49+ (no especializado en contratos) · Excel/papel (el competidor real) | A |
| 14 | tono | Directo, práctico y de taller: números concretos, sin tecnicismos ni promesas exageradas | B |
| 15 | PS | `[PENDIENTE - primeros clientes / testimonios]` | B |
| 16 | RLP | Contrato SaaS estándar + tratamiento de datos de los clientes del taller; NO prometer cobros/renovaciones automáticas ni recuperación de contratos perdidos ni envío SMS/email en MVP (límites en `MANUAL_VENTAS.md` §Qué NO prometer) | C |
| 17 | slogan | Nunca más se te pase una renovación | B |
| 18 | oferta | Contratos de mantenimiento con alerta 60 días antes de cada vencimiento — desde $29/mo | A |
| 19 | descripcion | ContractRenew: registro de contratos de mantenimiento y alertas de renovación para talleres que hoy los llevan en papel o Excel | B |
| 20 | cta | "Pásame la lista de contratos y les genero el primer reporte hoy" | A |
| 21 | tipografia | Inter (sistema, una sola familia) | C |

---

## Vector (formato brief-server `brief.parse`)

```
industria: Software B2B / SaaS de gestión para oficios y servicios [A] |nicho: Talleres HVAC (calefacción/aire acondicionado), plomería y eléctrica con contratos de mantenimiento anual [A] |especializacion: Contratos de mantenimiento anual (2 visitas + prioridad) y alertas de renovación 60 días antes [B] |vendes: SaaS de registro de contratos de mantenimiento + alerta de vencimientos: "el 20% que protege el 80% del ingreso recurrente de la tienda" [A] |audiencia: Dueños de talleres de 1-5 técnicos (118k talleres HVAC solo en US) que llevan los contratos en Excel, carpeta de papel o la memoria del dueño; $200-500/mo de software enterprise no les sirve [A] |dolor: 1) No saber cuántos contratos activos ni cuándo vence cada uno. 2) Cada renovación que se pasa = $600-2,000/año de ingreso garantizado perdido. 3) Excel no le avisa; el aviso ES el producto [B] |PBP: Promesa: nunca más se te pasa una renovación — aviso 60 días antes de cada vencimiento. Beneficio: ingreso recurrente protegido por menos que un servicio de emergencia al mes ($0.97/día) [B] |lograr: Suscripción activa con contratos cargados y reporte de vencidos/próximos 60 días revisado semanalmente [A] |vivir: Landing propia (puerto 3017) + prospección directa por WhatsApp/visita con script (sin marketplaces ni ads en MVP) [B] |LAPVTFU: [PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo],[PENDIENTE - Activo] |PM: Plan Taller $29/mo (1-25 contratos, alertas 60d) · Plan Crew $49/mo (ilimitado + reporte mensual de ingreso recurrente); infra MVP Express+SQLite ≈ <$5/mes → margen >85% [hipótesis, validar con hosting real] [B] |objecion: 1) "Lo tengo en Excel" → Excel no le avisa. 2) "Muy caro" → $0.97/día; un contrato perdido = $600-2,000/año. 3) "Somos muy pocos" → justamente para eso: los grandes ya tienen su sistema. 4) "¿Qué necesito?" → nombre del cliente y fecha de renovación. Nada más [A] |competidores: ServiceTitan $200-500/mo (enterprise) · Housecall Pro $49+ (no especializado en contratos) · Excel/papel (el competidor real) [A] |tono: Directo, práctico y de taller: números concretos, sin tecnicismos ni promesas exageradas [B] |PS: [PENDIENTE - primeros clientes / testimonios] [B] |RLP: Contrato SaaS estándar + tratamiento de datos de los clientes del taller; NO prometer cobros/renovaciones automáticas ni recuperación de contratos perdidos ni envío SMS/email en MVP (límites en MANUAL_VENTAS.md §Qué NO prometer) [C] |slogan: Nunca más se te pase una renovación [B] |oferta: Contratos de mantenimiento con alerta 60 días antes de cada vencimiento — desde $29/mo [A] |descripcion: ContractRenew: registro de contratos de mantenimiento y alertas de renovación para talleres que hoy los llevan en papel o Excel [B] |cta: "Pásame la lista de contratos y les genero el primer reporte hoy" [A] |tipografia: Inter (sistema, una sola familia) [C]
```
