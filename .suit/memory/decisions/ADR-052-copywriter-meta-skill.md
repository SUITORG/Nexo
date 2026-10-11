# ADR-052: Skill copywriter-meta (5 copys Meta-compliant + revisión por demanda)

## Status
Accepted (2026-10-11)

## Context
El copywriting de pago (pauta Meta) no estaba cubierto: `clusters-seo`/`paginas-seo` cubren SEO, `landing-pages` el sitio, `viral-short-form` hooks de video — pero nadie generaba ni auditaba copy de Facebook/Instagram Ads con compliance de políticas Meta. El usuario aportó el prompt base (5 variaciones, tono humano, urgencia natural, cero baneo) y pidió además un modo revisor que mejore copys/hooks/estrategias existentes por demanda, complementando (sin duplicar) las otras skills.

## Decision
Crear `copywriter-meta` (`.agents/skills/copywriter-meta/`, governance yaml en `.suit/skills/domain/`, registry indexado) con 2 modos:

- **GENERAR:** 5 variaciones completamente reescritas (ganchos distintos: pregunta/historia/beneficio/objeción/dato), tono humano, urgencia lógica por variación, compliance estricto (sin tú acusatorio sobre atributos personales, sin promesas categóricas ni ingresos específicos, sin mayúsculas sostenidas).
- **REVISAR:** checklist compliance + scoring (gancho/valor/CTA/tono/compliance) + reescritura mínima de lo que falla.

**Reuso:** frameworks PAS/AIDA del agente `copywriter` (registry), efecto progreso de `marketing-psicologia-progreso` (solo progreso real), audiencia/objeciones del BRIEF existente. Sin Ads Manager ni segmentación (fuera de alcance declarado).

## Rationale
- Compliance Meta evita baneos que destruyen cuentas publicitarias — skill con reglas duras, no opcional.
- Modo revisor satisface "mejorar escritos por demanda" sin regenerar lo que otras skills ya produjeron (RUCP).
- Completó la capa paid del funnel (SEO → landing → ads) para 4G de ideas-saas y la cadena máscara.

## Consequences
- Skills de copy ahora cubren todo el espectro: SEO (clusters/paginas) · landing (landing-pages) · paid (copywriter-meta) · video hooks (viral-short-form).
- Política Meta cambia con el tiempo → si Meta endurece reglas, actualizar checklist del modo REVISAR.
- No es skill canónica de la cadena máscara (invocación manual o post-4G); si el usuario pide automatizar esa unión, agregar switch `ads`.

## Related
- `.agents/skills/copywriter-meta/SKILL.md`, `.suit/skills/domain/copywriter-meta.yaml`
- ADR-051 (4G — pauta como siguiente paso tras landing)
- `marketing-psicologia-progreso` (registry skills.yaml:240)
