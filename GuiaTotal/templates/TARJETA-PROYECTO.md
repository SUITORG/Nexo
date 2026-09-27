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

documentos:                      # guia-total marca true al crearlos
  analista_proy: false           # Analista_Proy.md
  contrato: false                # <Proyecto>/CONTRATO.md
  identidad: false               # <Proyecto>/IDENTIDAD_CORPORATIVA.md
  manuales: false                # <Proyecto>/MANUAL_*.md (4)
  prompt_origen: false           # <Proyecto>/PROMPT_ORIGEN.md
  checklist_lanzamiento: false   # <Proyecto>/CHECKLIST-LANZAMIENTO.md

proximo_paso: "<acción concreta siguiente>"
```
