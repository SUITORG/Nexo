# PROMPT ORIGEN - SuitServiHogar

> Generado desde: GuiaTotal/prompts/PROMPT_ORIGEN.md · 2026-10-04 · Versión: 1.0
> Actualizado por: /guia-total origen (última pasada: 2026-10-04)

---

## Instrucción base (bloque para copiar a una IA)

```text
[ROL Y CONTEXTO DEL PROYECTO]

Proyecto: SuitServiHogar - marketplace bilateral de servicios para el hogar en Reynosa,
Tamaulipas: conecta hogares con técnicos Deep-Vetting verificados, pago en escrow real
vía Stripe Connect y PIN de conformidad antifuga.
Origen: mercado fronterizo fragmentado (sin verificación, precios opacos, pagos
informales) + la verificación presencial es la barrera de entrada que ningún player
nacional atiende en Reynosa.
Etapa actual: construcción - MVP completo 41/41 requisitos con tests y CI/CD, panel
juzgador APROBADO CONDICIONAL (6.93/10), faltan VALIDACION.md y las condiciones de
go-live del veredicto.

CONTEXTO DE DATOS
- Motor: Supabase (PostgreSQL + Auth + Realtime + Storage, proyecto egyxgnlnzanxpqyuvmsg)
  con RLS. NO usa Google Sheets ni Config_Empresas, NO usa GAS (micro-frontend aislado).
- Artefactos vivos: docs/Contrato.md (v6.0, 41/41), 4 manuales en docs/, identidad,
  taxonomía, Analista_Proy.md, veredicto + 4 evals, sh_config (parámetros de negocio
  configurables desde el backoffice).

COMO TRABAJA EL DUEÑO
- Prefiere documentación en archivos .md con nombres cortos que se puedan consultar
  para recordar para qué sirve cada cosa.
- Necesita respuestas directas, sin rodeos, y ejemplos concretos antes que teoría.
- Pide desglose de solicitudes en archivos .md cuando el tema es grande.
- Trabaja por fases con commit por fase; no tocar código sin contrato resuelto.

REGLAS DEL PROYECTO (de SuitServiHogar/docs/Contrato.md)
1. Aislamiento: single-tenant Reynosa; toda query filtra el contexto del tenant (RLS).
2. Soft delete: solo `active = false`, nunca DELETE físico.
3. IDs secuenciales del negocio (no UUIDs expuestos) y montos en centavos INTEGER.
4. Status machine cerrada: draft → funded → in_progress → completed → released.
5. Bimonetario MXN/USD (rate fallback 18.0, fuente Fixer.io).
6. Límites: micro-frontend aislado ADR-029 - NO se integra al SPA SuitOrg, NO se usa
   GAS ni tablas MASTER; React 19 permitido como excepción documentada.
7. Stripe webhook registrado ANTES de express.json() en server.js.

AGENTES / SKILLS QUE AYUDAN A AVANZAR MÁS RÁPIDO
- ciclo - mantenimiento por fases con contrato y validación
- auditoria - docs de arquitectura 05-16 en docs/
- guia-total (manuales / identidad / origen / checklist) - artefactos de documentación
- Ver GuiaTotal/MAPA.md para el árbol completo de triggers.

QUÉ DOCUMENTAR CUANDO HAY CAMBIOS
- Actualizar esta instancia si cambió la etapa o las reglas.
- Actualizar manuales si cambió UI/backend (ver /guia-total manuales).
- Actualizar docs/Contrato.md si cambió un requisito o una invariante.
```

---

## Hechos del proyecto (resumen fuera del bloque)

- **Stack:** React 19 + Vite + TypeScript + Tailwind v4 (frontend) · Express `server.js` puerto 3010 (Stripe Connect onboarding, PaymentIntent, webhook, CFDI) · Supabase con RLS.
- **Puertos:** 3000 Vite · 3010 API.
- **Test card:** `4242 4242 4242 4242` · fecha futura · CVC 123 · ZIP 88720.
- **Comisión:** `platform_fee_pct` 15 (configurable en `sh_config`); volume discount, cupones, referidos y donaciones también parametrizables desde AdminScreen.
- **Excepción arquitectónica:** ADR-029 — micro-frontend aislado, React permitido, sin integración al SPA SuitOrg.
