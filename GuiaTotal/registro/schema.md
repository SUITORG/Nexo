# registro/ — Tarjetas de proyecto (contrato CRM-ready)

> **Para qué sirve:** una tarjeta YAML por proyecto que cualquier sistema (pasado, presente o futuro) puede leer o escribir sin acoplarse a esta guía. Es el punto de extensión "listo para CRM": mismo archivo, contrato estable.

## Estructura

```
GuiaTotal/registro/
├── schema.md              ← este archivo (contrato)
└── <proyecto>.yaml        ← una tarjeta por proyecto (la crea guia-total)
```

## Reglas

1. **Una tarjeta = un proyecto.** Nombre del archivo = nombre del proyecto en minúsculas y con guiones (`mi-proyecto.yaml`).
2. **Solo `guia-total` la escribe** en flujo normal (etapa, documentos, próximo paso). Edición manual solo para corregir hechos.
3. **Campos obligatorios**: `proyecto`, `ruta`, `etapa`, `creado`, `actualizado`, `proximo_paso`.
4. **`etapa`** es el motor de ruteo: `idea` → flujo IDEA · `construccion` → ciclo F0-F7 · `mantenimiento` → solo ciclo.
5. **`convive_sheets`** nace de la pregunta obligatoria en etapa idea; si es `true`, `id_empresa` y `db_engine` se completan al leer `Config_Empresas`.
6. **`documentos.*`** son booleanos que `guia-total` pone en `true` al crear cada artefacto — sirven para saber qué falta crear sin abrir el proyecto. Las rutas de instancia son `<Proyecto>/docs/`.
7. **`taxonomia.{industria,nicho,especializacion}`** replica los 3 campos de `<Proyecto>/docs/TAXONOMIA.md` (identificados en el análisis) para que sistemas externos puedan leerlos sin abrir el proyecto.
8. **Versionado**: el campo `actualizado` se toca en cada pasada; el histórico vive en git.

## Schema

La plantilla completa (campos y comentarios) está en `../templates/TARJETA-PROYECTO.md`. Si este schema y la plantilla divergen, **manda la plantilla** y corrige este archivo.

## Consumo externo

- Lectura: `*.yaml` es parseable por cualquier lenguaje (`YAML`/`JSON` convertible).
- Escritura externa (otro sistema/CRM): permitida si respeta los campos y avisa al dueño; tras escribir, corre `/guia-total [ruta]` para que la guía re-sincronice.
- Nunca borrar una tarjeta: si el proyecto se archiva, pon `etapa: archivado`.
