---
name: micro-app-saas
description: "Gate de pre-diseño que decide la FORMA del producto (micro-app · micro-saas · web-app · landing-leads · herramienta-interna · multi-tenant-gs) y su RUTA DE COBRO (pago único, suscripción, por uso, setup+mes, licencia/white-label, ahorro interno). Úsala cuando digas '¿micro app o micro saas?', 'micro-app o micro-saas', 'qué formato', 'cómo se cobra', '¿puede monetizarse?', 'producto nuevo', 'alcance del producto', '¿vale la pena venderlo?', 'no sé si hacer una app o un SaaS', o cuando guia-total/ideas-saas tengan que decidir el formato antes de diseñar. No la pidas explícita: se ejecuta sola en el pre-diseño. Si no hay ruta de cobro viable → gate duro: se para."
license: MIT
compatibility: "Claude Code y opencode. Sin dependencias externas (solo lee la idea/Analista_Proy.md y escribe la tarjeta + FORMATO.md)."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# micro-app-saas — gate de forma + cobro

**Qué es:** el 4º gate de pre-diseño. Antes de diseñar cualquier producto nuevo decide **dos cosas** y las fija por escrito: (1) la **forma** mínima que resuelve el problema — micro-app vs micro-saas y variantes — y (2) la **ruta de cobro**. Es **gate duro**: sin ruta de cobro viable, se para.

**No confundir con:** `viabilidad-operativa` (esfuerzo, tiempo, consumo, riesgo de ban) · `calidad-minima` (piso anti-mediocre) · `durabilidad` (¿durará?). Este mide **forma + dinero**.

## Entrada

- Idea nueva, `Analista_Proy.md`, `SINTESIS_PROYECTO.md` o la descripción del chat. Si falta, pregunta lo mínimo.
- Lee `.suit/config/switches.yaml` (`parametros`): con `decision_libre=true` (defecto) → **0 preguntas**, documenta supuestos; si no, **≤3 preguntas**.

## Paso 1 — Forma (2-3 preguntas)

1. ¿Vende a terceros (clientes externos que pagan)?
2. ¿Uso repetido con login / varios usuarios?
3. ¿Vive dentro de la plataforma GS (`Config_Empresas` / multi-inquilino)?

Matriz de salida:

| Forma | Cuándo | Señal |
|---|---|---|
| `micro-app` | 1 problema, 1 pantalla, uso propio o 1 usuario, sin login, sin multi-cliente | la opción más barata que sirve |
| `micro-saas` | muchos usuarios, login, uso repetido, clientes que pagan | login + suscripción |
| `web-app` | login + 1 flujo, un solo cliente/equipo interno | CRUD simple |
| `landing-leads` | solo captación, no hay producto detrás | no es producto → descarta o sube a micro-saas |
| `herramienta-interna` | uso propio de SuitOrg, sin clientes | sin web, sin leads |
| `multi-tenant-gs` | multi-inquilino sobre `Config_Empresas` | cadena `empresa-mascara` |

**Regla 80/20:** por defecto nace `micro-app`. Solo se sube a `micro-saas` si la pregunta 1 y la 2 dan **sí**. No construir el andamiaje de SaaS por costumbre.

## Paso 2 — Ruta de cobro (6 modelos)

| Modelo | Cuándo | Cómo se implementa |
|---|---|---|
| `pago-unico` | utilidad puntual, micro-app | link de pago (Stripe Link / Gumroad) |
| `suscripcion` | uso continuo, micro-saas | Stripe suscripción / cobro recurrente |
| `por-uso` | consumo variable (créditos, llamadas) | medidor + cobro por evento |
| `setup-mes` | instalación + mantenimiento (agencia) | cargo inicial + cuota mensual |
| `licencia-white-label` | reventa a otras agencias/marcas | contrato de licencia por instancia |
| `ahorro-interno` | herramienta propia, no se vende | valor = horas/dinero que ahorra (documentar) |

Elige **uno principal** (los demás son alternativas). Documenta: quién paga, cuánto, con qué medio.

## Paso 3 — Gate duro

- Hay forma + ruta de cobro clara → **APTO**.
- Hay ruta pero exige bajar alcance o cambiar forma → **APTO CON CONDICIONES** (dile la condición).
- No hay ruta de cobro → **NO APTO**: parar y reportar (no se diseña ni se construye).
  - **Excepción:** `herramienta-interna` / `ahorro-interno` con un consumidor definido (nombre quién la usa y qué ahorra) → **APTO CON CONDICIONES** como máximo.

## Salida (≤1 página)

1. Bloque en la tarjeta `GuiaTotal/registro/<slug>.yaml`:
   ```yaml
   producto:
     formato: "micro-app | micro-saas | web-app | landing-leads | herramienta-interna | multi-tenant-gs"
     monetizacion: "pago-unico | suscripcion | por-uso | setup-mes | licencia-white-label | ahorro-interno"
     ruta_cobro: "<quién paga · cuánto · con qué medio>"
     gate_cobro: "APTO | APTO CON CONDICIONES | NO APTO"
   ```
2. Si el proyecto vive en disco: `<Proyecto>/docs/FORMATO.md` con:
   ```
   ## Forma        → tabla de decisión (2-3 preguntas) + formato elegido
   ## Ruta de cobro → modelo + quién paga + cómo
   ## Veredicto     → APTO | APTO CON CONDICIONES | NO APTO — <1 línea>
   ```

## Enganches

- `guia-total` Flujo IDEA: paso previo a construir (junto a los gates de pre-diseño).
- `ideas-saas` Etapa 1: fija `Formato` y `Ruta de cobro` en la tarjeta de idea. Etapa 3/4: si el formato no es `micro-saas`, **omite el andamiaje SaaS** (4P login/CRUD y, si aplica, 4G.3 landing). El formato elegido alimenta directamente la tabla 4G.2.

## Reglas

| id | regla | severidad |
|---|---|---|
| ma-001 | Sin ruta de cobro clara → `NO APTO` y se para (salvo herramienta-interna con consumidor definido) | error |
| ma-002 | Por defecto `micro-app`; subir a `micro-saas` solo si vende a terceros **y** tiene uso repetido con login | error |
| ma-003 | ≤3 preguntas (o 0 con `decision_libre=true`); cada supuesto marcado `[supuesto]` | warning |
| ma-004 | Salida ≤1 página con estructura fija (Forma · Ruta de cobro · Veredicto) | warning |
| ma-005 | No duplica `viabilidad-operativa`/`calidad-minima`/`durabilidad`; juzga forma y dinero, no mercado (eso es `analista-proy`) | warning |

## Cierre

`✅` veredicto en la tarjeta + `FORMATO.md` · `❓` falta UNA decisión (formato o cobro) · `⛔` `NO APTO` (detenido, no rodear).
