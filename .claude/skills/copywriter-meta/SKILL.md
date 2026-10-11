---
name: copywriter-meta
description: "Copywriter experto en Facebook/Instagram Ads con compliance Meta y psicología del consumidor. DOS modos: (1) GENERAR — 5 variaciones completamente diferentes de copy para anuncio (gancho/cuerpo/temporal+CTA, tono humano, urgencia natural, cero baneo); (2) REVISAR — audita y reescribe copy, hooks o estrategias existentes con checklist de políticas Meta + scoring. Úsala cuando el usuario diga 'copy para facebook', 'anuncios meta', '5 copys', 'ads copy', 'texto de anuncio fb', 'revisa este copy', 'mejora este hook', 'compliance meta', 'copy baneado', o pida pauta/ads/paid para un producto. Complementa (no duplica): viral-short-form da hooks, landing-page-copywriter da frameworks de landing, brief-engine da audiencia. Revisa por demanda — no genera campañas completas ni toca Ads Manager."
license: MIT
compatibility: "Claude Code y opencode. Sin dependencias externas."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# copywriter-meta — 5 copys Meta-compliant + revisión por demanda

## Entradas

- **GENERAR:** producto/servicio + público (idealmente del BRIEF ya existente: segmentos 5 audiencia, 6 dolor, 12 objeciones, 14 tono).
- **REVISAR:** el copy/hook/estrategia pegado por el usuario (+ contexto del producto si no está en el brief).

Si hay `BRIEF_CLIENTE.md` o vector brief del tenant → úsalo como fuente de audiencia/dolor/objeciones sin preguntar. Si no hay brief → ≤3 preguntas: producto, público, tono.

## Modo GENERAR — 5 variaciones

Reglas estrictas (todas obligatorias en las 5):

1. **Tono humano** (elegir el que pida el usuario: conversacional · empático · profesional-cercano · directo). Sonar como recomendación de un amigo o profesional confiable. Prohibido: palabras hipercomerciales, promesas poco realistas, `!!!`, MAYÚSCULAS SOSTENIDAS.
2. **Estructura completamente reescrita** (no sinónimos). Cada variación empieza distinto: pregunta · historia corta · beneficio directo · objeción derribada · dato/contexto. Distribuir los 5 ganchos entre las variaciones.
3. **Urgencia natural** (1 por variación, lógica y humana): "Esta semana", "Solo por hoy", "A partir de este mes", "Antes de que termine el mes". Nunca urgencia falsa ni agresiva.
4. **Compliance Meta (cero baneo):**
   - Sin afirmaciones categóricas ("garantizado", "el mejor", "sin fallar").
   - Sin característica personal acusatoria: ❌ "¿Estás quebrado?" → ✅ "¿Te ha pasado que el presupuesto no rinde?".
   - Sin promesas de resultados mágicos ni ingresos específicos ("gana $5,000/semana" prohibido).
   - Seguro personal-attributes (salud, deuda, condición): hablar del *problema externo*, no de la persona.

**Salida por variación:**

```
### Variación N — [ganchotype: pregunta | historia | beneficio | objeción | dato]
**Gancho:** ...
**Cuerpo:** ... (valor real, 2-4 frases)
**Temporal + CTA:** ... (1 urgencia lógica + 1 llamada)
```

Al final: tabla resumen (variación → gancho → tono → urgencia) y nota de cuál usar por objetivo (clics, mensajes, registro) según psicología del consumidor.

## Modo REVISAR — auditoría por demanda

1. **Checklist compliance Meta** (pasa/falla por punto):
   - [ ] Tú acusatorio sobre atributos personales
   - [ ] Mayúsculas sostenidas / signos excesivos
   - [ ] Promesas categóricas o de resultado garantizado
   - [ ] Urgencia falsa (countdown fake, "últimas horas" sin base)
   - [ ] Datos de contacto/engagement-bait ("comparte si…", "etiqueta a…")
   - [ ] Comparación directa nombrando competidor (riesgoso)
2. **Scoring** 1-5: gancho · valor percibido · CTA · tono · compliance.
3. **Reescritura:** versión limpia que arregla solo lo que falla (preservar lo que funciona — RUCP no reescribir por reescribir).
4. **Diagnóstico:** qué cambiaría el resultado (gancho genérico, CTA ambiguo, sin dolor real) + 1 sugerencia de estructura alternativa.

Si el copy venía de otra skill (hook de viral-short-form, landing de brief-engine), esta skill solo audita/reescribe — no regenera el original.

## Reglas

- Reusar frameworks PAS/AIDA del agente `copywriter` (registry) y el efecto de progreso de `marketing-psicologia-progreso` en CTAs (solo progreso real, sin progreso ficticio).
- Si el usuario pide campañas/segmentación/presupuesto → eso es Ads Manager, fuera del alcance; entregar solo el copy y decirle que la pauta se configura en Meta.
- Tono y límites (RLP) del brief/tenant mandan sobre los defaults de esta skill.
- Máximo 1 ronda de preguntas antes de generar (≤3 preguntas, luego produce).
