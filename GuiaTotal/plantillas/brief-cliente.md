# BRIEF CLIENTE IDEAL — {{NOMBRE}}

> **Tipo:** brief local de producto propio (NO es brief de tenant).
> **Regla:** este producto **no existe en `Config_Empresas`** → `id_empresa: null`. No usar `empresa-mascara` ni la cadena clusters-seo/paginas-seo (salvo decisión 4G multi-tenant).
> **Estructura:** 21 segmentos de brief-engine v1.0 (`be-001..be-021`), semáforos de confianza `[A]` (dato duro) / `[B]` (investigado) / `[C]` (asumido).
> **Insumos:** `MANUAL_VENTAS.md` (ICP, precios, objeciones, scripts), informe de evaluación + `SINTESIS_PROYECTO.md` (modo verificadas), panel juez {{SCORE}}.
> **Generado:** {{FECHA}} · **Motor:** brief-engine (adaptado local, sin fila Sheets)

---

## Segmentos (orden be-001..be-021)

| # | Segmento | Valor | Conf. |
|---|---|---|---|
| 1 | industria | {{...}} | ? |
| 2 | nicho | {{...}} | ? |
| 3 | especializacion | {{...}} | ? |
| 4 | vendes | {{...}} | ? |
| 5 | audiencia | {{...}} | ? |
| 6 | dolor | {{...}} | ? |
| 7 | PBP | {{...}} | ? |
| 8 | lograr | {{...}} | ? |
| 9 | vivir | {{...}} | ? |
| 10 | LAPVTFU | `[PENDIENTE - Activo]` ×7 | — |
| 11 | PM | {{planes y precios}} | ? |
| 12 | objecion | {{4 objeciones → respuestas}} | ? |
| 13 | competidores | {{...}} | ? |
| 14 | tono | {{...}} | ? |
| 15 | PS | `[PENDIENTE - primeros clientes]` | ? |
| 16 | RLP | {{límites legales — ver MANUAL_VENTAS §Qué NO prometer}} | C |
| 17 | slogan | {{...}} | ? |
| 18 | oferta | {{...}} | ? |
| 19 | descripcion | {{...}} | ? |
| 20 | cta | {{...}} | ? |
| 21 | tipografia | Inter (sistema, una sola familia) | C |

---

## Vector (formato brief-server `brief.parse`)

```
industria: ... [A] |nicho: ... [A] |especializacion: ... [B] |vendes: ... [A] |audiencia: ... [A] |dolor: ... [B] |PBP: ... [B] |lograr: ... [A] |vivir: ... [B] |LAPVTFU: [PENDIENTE - Activo]×7 |PM: ... [B] |objecion: ... [A] |competidores: ... [A] |tono: ... [B] |PS: [PENDIENTE] [B] |RLP: ... [C] |slogan: ... [B] |oferta: ... [A] |descripcion: ... [B] |cta: ... [A] |tipografia: Inter [C]
```

## Reglas de llenado

1. Copy de la landing sale de los segmentos 6,7,11,12,17,18,19,20 — nada inventado fuera del brief.
2. Semáforos obligatorios: sin dato real no hay `[A]`; investigado `[B]`; asumido `[C]`.
3. `LAPVTFU` se llena al generar los 7 activos con Flow (Etapa 4G).
