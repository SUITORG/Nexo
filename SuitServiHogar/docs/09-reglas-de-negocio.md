# 09 — Reglas de negocio · SuitServiHogar

> **Para qué sirve este documento:** reglas verificables con evidencia en código.
> **Última revisión:** 2026-10-04 · **Generado por:** skill `auditoria` (llamada por `guia-total`)
> **Fuentes:** `docs/Contrato.md` v6.0 (41/41), `server.js`, `src/`, migraciones SQL.

| ID | Regla | Evidencia | Rol afectado | Datos | Casos límite | Validación |
|---|---|---|---|---|---|---|
| RN-01 | El pago se retiene en escrow hasta que el cliente confirma con PIN de 4 dígitos | `MANUAL_CLIENTE` PIN, `SettlementEscrowScreen.tsx`, `antifuga_config` | Cliente, Técnico | órdenes, montos | PIN erróneo 3 veces → bloqueo temporal | E2E flujos Playwright |
| RN-02 | Flujo de orden cerrado: `draft → funded → in_progress → completed → released` | `Contrato.md` req. máquina de estados; `sh_orders.status` | Ambos | `sh_orders` | salto de estado → rechazado | unit + E2E |
| RN-03 | Comisión de plataforma configurable (default 15%) aplicada por PaymentIntent | `server.js` `loadConfig()` `platform_fee_pct: 15`, tabla `sh_config` | Admin | `sh_config.platform_commission` | config ausente → DEFAULT_CONFIG | `GET /api/config` |
| RN-04 | Bimonetario MXN/USD con rate fallback fijo 18.0 | `src/services/exchangeRate.ts` (Fixer.io) + `Contrato.md` req. 26 | Cliente, Técnico | montos en centavos INTEGER | Fixer caído/100 req/mes → fallback | unit exchangeRate |
| RN-05 | Volume discount: 20+ órdenes y rating ≥4.7 → −10% comisión | `server.js` `volume_discount_pct: 10`, `volume_min_orders: 20`, `volume_min_rating: 4.7` | Técnico | `sh_config` | rating 4.69 → no aplica | `validate-coupon` |
| RN-06 | Cupones máx. 50% descuento | `server.js` `coupon_max_discount_pct: 50` | Ambos | cupones | cupón >50% → recortado a 50 | `POST /api/validate-coupon` |
| RN-07 | Referidos: técnico $1,500 MXN / cliente $1,000 MXN (configurable) | `server.js` `referral_tech_reward_mxn: 15000` (centavos) | Ambos | `referral_rewards` | reward fuera de rango → default | `sh_config` |
| RN-08 | Donación caridad: 1% de la comisión + redondeo solidario del cliente | `server.js` `charity_fee_pct: 1` | Ambos | caridad | config no numérica → `1` | `sh_config` |
| RN-09 | Técnico "Certificado de Confianza" = 10 servicios consecutivos de 5★ | `MANUAL_TECNICO.md`, `TAXONOMIA.md` | Técnico | reseñas | empate/1 estrella corta racha | NO automatizado (manual de diseño) → `DECISIÓN PENDIENTE` |
| RN-10 | Toda orden pasa por Stripe Connect (onboarding del técnico, split de pago) | `server.js` `/api/create-connect-account`, `migrations/20260914170500_stripe_connect.sql` | Técnico | cuentas Stripe | cuenta no onboarded → PaymentIntent falla | test card 4242 |
| RN-11 | ID y alcance: single-tenant Reynosa, aislamiento por prefijo `sh_` + RLS (no `id_empresa`) | `ADR-029`, `migrations/*_security_rls.sql` | Todos | todas `sh_*` | intento cross-tenant → RLS bloquea | matriz `10-seguridad` |
| RN-12 | Soft delete: `active = false`, nunca DELETE físico | `AGENTS.md` reglas, tablas `sh_*` | Admin | registros | borrado físico prohibido | reviewer standard |
| RN-13 | Geocodificación con obfuscación de ubicación exacta del domicilio | `src/services/gpsService.ts` (coords ofuscadas en maps) | Cliente | GPS | sin permiso GPS → fallback manual | unit gpsService |
| RN-14 | Límite de descripción de trabajo: 4000 caracteres en análisis IA | `server.js:775` `.slice(0, 4000)` | Cliente | texto | >4000 → truncado | unit/ai |

**No automatizadas aún** (diseño en manuales, sin código): RN-09 certificación y proceso de disputas/chargebacks (riesgo CRÍTICO del veredicto). Ver `15-riesgos`.
