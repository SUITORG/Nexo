# TARJETA DE PROYECTO (plantilla)

> **Para qué sirve:** una tarjeta por proyecto, en `GuiaTotal/registro/<proyecto>.yaml`, siguiendo el schema de `GuiaTotal/registro/schema.md`. La crea/actualiza `guia-total` — no se edita a mano salvo corrección puntual.
> **Formato:** YAML (legible por personas y por sistemas externos — es el contrato "CRM-ready").

```yaml
# GuiaTotal/registro/<proyecto>.yaml
proyecto: "<nombre>"
ruta: "<ruta relativa>"
etapa: "idea | construccion | mantenimiento"   # guia-total la actualiza
creado: "YYYY-MM-DD"
actualizado: "YYYY-MM-DD"

validacion:
  problema: "<dolor concreto que resuelve>"
  hipotesis: "<si hacemos X para Y, mejorará Z>"
  metrica_exito: "<métrica mínima>"
  evidencia: "<dónde está Analista_Proy.md y qué dice>"
  decision: "continuar | cambiar | detener"
  motivo: "<por qué>"

evaluacion:
  panel_juzgador: "APROBADO | APROBADO CONDICIONAL | RECHAZADO | POSPUESTO | no evaluado"
  veredicto_fecha: "YYYY-MM-DD"
  recomendaciones: "<resumen — no bloquea>"

integraciones:
  convive_sheets: true          # pregunta obligatoria en etapa idea
  id_empresa: null              # de Config_Empresas si convive_sheets
  db_engine: null               # GSHEETS | SUPABASE | NEON
  brief_en_logo_url: false      # hay Brief generado?

taxonomia:                       # 3 campos del análisis (match al catálogo GuiaTotal/TAXONOMIA.md)
  industria: null
  nicho: null
  especializacion: null

documentos:                      # guia-total marca true al crearlos
  analista_proy: false           # <Proyecto>/docs/Analista_Proy.md
  taxonomia: false               # <Proyecto>/docs/TAXONOMIA.md (3 campos)
  contrato: false                # <Proyecto>/docs/CONTRATO.md
  identidad: false               # <Proyecto>/docs/IDENTIDAD_CORPORATIVA.md
  manuales: false                # <Proyecto>/docs/MANUAL_*.md (4)
  prompt_origen: false           # <Proyecto>/docs/PROMPT_ORIGEN.md
  checklist_lanzamiento: false   # <Proyecto>/docs/CHECKLIST-LANZAMIENTO.md
  arquitectura_docs: false       # <Proyecto>/docs/05-* y 06-* (skill auditoria)

proximo_paso: "<acción concreta siguiente>"
```
