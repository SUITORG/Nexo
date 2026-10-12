# FASES-PRODUCTO — de idea a producto terminado

> **Para qué sirve:** una sola escala para saber en qué fase está cada módulo Suit* — no solo si es "idea" o "código", sino qué tan cerca está de que **el cliente lo opere solo**. Se usa en la tarjeta del registro (`fase_producto:`) y en las corridas `/ideas` (informan hasta qué fase llegaron).
> **Creado:** 2026-10-12 · **Ref:** ADR-051/053 · Plantilla: guiar decisions post-corrida.

## Las 7 fases

| Fase | Nombre | Qué significa | Quién opera | Gate para pasar |
|---|---|---|---|---|
| **0** | **Idea** | Solo el concepto + tarjeta | — | Panel juez ≥7.5 |
| **1** | **Verificado** | Analista + síntesis + re-juez con evidencia | — | Re-juez ≥7.5 |
| **2** | **MVP** | Núcleo funcional (código + API + CLI) | Operador SuitOrg | Smoke E2E PASA |
| **3** | **Validado** | Ciclo: contrato, evidencia en VALIDACION.md | Operador SuitOrg | Ciclo F1-F3 PASA |
| **4** | **Vendible** | Landing + leads + brief + activos + manuales | Operador SuitOrg (venta) | Landing 200 + lead 201 |
| **5** | **Operable** | El cliente lo opera solo: **login + dashboard + carga propia** | **Cliente** (con soporte) | Cliente carga 10 contratos sin ayuda |
| **6** | **Automático** | Avisos/avisos automáticos (correo), respaldo programado, cobros (Stripe) | Sistema + Cliente | Primer correo automático enviado + backup verificado |
| **7** | **Terminado (SaaS)** | Auto-servicio: signup público, cobro activo, multi-taller si aplica, soporte mínimo | **Sistema solo** | 1er cliente no-piloto paga y opera sin intervención |

## Dónde está cada módulo hoy

| Módulo | Fase | Falta para la siguiente |
|---|---|---|
| SuitContractRenew | **6 (Automático)** | Fase 7: signup público y cobros |
| SuitPawBook | **4 (Vendible)** | Fase 5: login + dashboard de reservas (landing y API listas) |
| SuitReviewPulse | **2-3 (MVP/Validado)** | Landing + leads (4G) pendiente |

## Definiciones operativas (contrato → producto terminado)

- **Llegan los avisos (fase 6):** correo automático al dueño y al cliente del taller, 60 días antes de cada vencimiento. MVP = consulta manual (`GET /api/contracts/due/60`).
- **Respaldo (fase 6):** BD SQLite respaldada programáticamente (hoy: archivo local, sin automatizar). Fase 7: nube o sync.
- **Quién lo usa:** fases 2-4 = SuitOrg opera; fase 5-6 = el taller opera con login; fase 7 = el taller se da de alta solo.
- **Cobros:** fuera de las 7 fases base (decisión POR CONFIRMAR: Stripe a futuro, no MVP).

## Reglas de uso
- La tarjeta `GuiaTotal/registro/<slug>.yaml` lleva `fase_producto: <0-7>` — se actualiza en cada gate.
- Las corridas `/ideas` documentan en el historial hasta qué fase llegaron (hoy: 4).
- Saltar fases está prohibido: no hay Fase 5 sin Fase 4 (sin landing no hay cliente que operar).
