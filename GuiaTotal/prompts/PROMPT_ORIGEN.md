# PROMPT ORIGEN (plantilla maestra)

> **Para qué sirve:** prompt vivo que describe el origen y contexto de un proyecto — de dónde sale, para quién es, cómo trabaja su dueño y qué reglas de comunicación/entrega tiene. Se usa como insumo de contexto al retomar un proyecto o al pedirle a una IA que trabaje en él.
> **Regla de vida:** la **instancia viva vive en la carpeta del proyecto** (`<Proyecto>/PROMPT_ORIGEN.md`), creada desde esta plantilla. Esta plantilla solo cambia cuando cambia la **metodología**, no cuando cambia un proyecto. Actualiza instancias con `/guia-total origen`.
> **Origen (ingeniería inversa):** `Documentacion/SuitOrg-PromptOrigen2.txt` (prompt original del usuario) + `AGENTS.md` + `contexto.md`.

---

## Instrucción base (bloque para copiar a una IA)

```text
[ROL Y CONTEXTO DEL PROYECTO]

Proyecto: [NOMBRE] — [qué es en 1-2 frases].
Origen: [por qué existe, qué problema original lo desencadenó].
Etapa actual: [idea | construcción | mantenimiento] — [dónde está hoy, 1-2 frases].

CONTEXTO DE DATOS
- [Motor: Google Sheets / Supabase / NEON / mixto — y si usa Config_Empresas]
- [Artefactos vivos del proyecto: Brief, activos, taxonomía, etc.]

CÓMO TRABAJA EL DUEÑO (adaptar al dueño real del proyecto)
- Prefiere documentación en archivos .md con nombres cortos que se puedan consultar para recordar para qué sirve cada cosa.
- Necesita respuestas directas, sin rodeos, y ejemplos concretos antes que teoría.
- Pide desglose de solicitudes en archivos .md cuando el tema es grande.

REGLAS DEL PROYECTO (copiar de <Proyecto>/CONTRATO.md si existe)
1. [invariante 1]
2. [invariante 2]
3. [límites: qué puede y qué no puede tocarse]

AGENTES / SKILLS QUE AYUDAN A AVANZAR MÁS RÁPIDO
- [skill 1] — para [tarea]
- [skill 2] — para [tarea]
- Ver GuiaTotal/MAPA.md para el árbol completo de triggers.

QUÉ DOCUMENTAR CUANDO HAY CAMBIOS
- Actualizar esta instancia si cambió la etapa o las reglas.
- Actualizar manuales/identidad si cambió UI/backend (ver /guia-total manuales).
```

## Cabecera obligatoria de cada instancia

```markdown
# PROMPT ORIGEN — [NOMBRE PROYECTO]
> Generado desde: GuiaTotal/prompts/PROMPT_ORIGEN.md · [FECHA] · Versión: 1.0
> Actualizado por: /guia-total origen (última pasada: [FECHA])
```

## Cambios de metodología (esta plantilla)

- 2026-09-26: creación inicial por ingeniería inversa de `SuitOrg-PromptOrigen2.txt`.
