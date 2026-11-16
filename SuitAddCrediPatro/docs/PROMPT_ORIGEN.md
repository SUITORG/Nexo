# PROMPT ORIGEN - SuitAddCrediPatro
> Generado desde: GuiaTotal/prompts/PROMPT_ORIGEN.md · 2026-11-12 · Versión: 1.0
> Actualizado por: /guia-total origen (última pasada: 2026-11-12)

---

## Instrucción base (bloque para copiar a una IA)

```text
[ROL Y CONTEXTO DEL PROYECTO]

Proyecto: SuitAddCrediPatro — herramienta informativa para buscar créditos y patrocinios (módulo estático de SuitOS).
Origen: el usuario quería una herramienta que, dado su tipo de negocio y zona, le recomiende dónde acercarse a solicitar crédito/patrocinio (público, privado, gobierno), que le pregunte lo necesario para identificar su problema, y le entregue un escrito de pros y contras para sus entrevistas con el fin de mejorar su probabilidad de aprobación. Uso personal por ahora.
Etapa actual: construcción — construido y probado (2026-11-12), documentado con guia-total; pendientes en GuiaTotal/PENDIENTES.md.

CONTEXTO DE DATOS
- Motor: ninguno externo — catálogo estático CATALOGO en app.js (18 programas verificados 2026-11: Impulso NL/FOCRECE, NAFIN, FIFOMI, fundaciones, banca, cámaras, crowdfunding) + localStorage['acp_perfil'].
- No usa Config_Empresas, no tiene servidor ni APIs.
- Artefactos vivos: docs/CONTRATO.md, docs/TAXONOMIA.md (3 campos), docs/MANUAL_*.md, docs/CHECKLIST-LANZAMIENTO.md, tarjeta GuiaTotal/registro/suitaddcredipatro.yaml, ADR-063.

COMO TRABAJA EL DUEÑO (adaptar al dueño real del proyecto)
- Prefiere documentación en archivos .md con nombres cortos que se puedan consultar para recordar para qué sirve cada cosa.
- Necesita respuestas directas, sin rodeos, y ejemplos concretos antes que teoría.
- Pide desglose de solicitudes en archivos .md cuando el tema es grande.

REGLAS DEL PROYECTO (de docs/CONTRATO.md)
1. Meramente informativo: no solicita créditos ni patrocinios, no promete aprobación; siempre indicar "confirma requisitos y vigencia con cada institución".
2. El catálogo es editable y fechado (verificado 2026-11): cada programa lleva fuente/contacto real; no inventar programas ni montos.
3. Vanilla JS (regla inmutable #7); node --check app.js tras cada edición.
4. Datos del perfil solo en localStorage del usuario — no se transmiten a ningún servidor.
5. noindex, nofollow mientras sea herramienta interna (regla EvaSol).
Límites: solo se modifica SuitAddCrediPatro/**; no tocar Config_Empresas/GAS ni otros módulos (MASTER.html solo su botón).

AGENTES / SKILLS QUE AYUDAN A AVANZAR MÁS RÁPIDO
- guia-total — etapas y documentación del proyecto (esta instancia).
- ciclo — contrato por fase y commits al modificar código.
- web-research — para refrescar el catálogo con programas vigentes.
- Ver GuiaTotal/MAPA.md para el árbol completo de triggers.

QUÉ DOCUMENTAR CUANDO HAY CAMBIOS
- Actualizar esta instancia si cambió la etapa o las reglas.
- Actualizar manuales si cambió UI/lógica (ver /guia-total manuales); cambios al catálogo → MANUAL_TECNICO §5 + CONTRATO §Cambios.
- Refrescar vigencia del catálogo cada ~3 meses (GuiaTotal/PENDIENTES.md).
```
