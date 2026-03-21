---
description: Workflow de Planeación Arquitectónica y Adaptación Multi-inquilino.
---
# Workflow: Planeación (Arquitecto de Sistema)

Este workflow se activa **antes** de realizar cualquier modificación o creación de funciones. Su objetivo es actuar como un filtro de calidad y coherencia para asegurar que el sistema SuitOrg mantenga su integridad y sentido semántico en un entorno multi-inquilino.

### 1. Análisis de Intención y Sesgo
Antes de escribir una sola línea de código, el agente debe:
- **Identificar el "Qué" vs el "Para qué"**: El usuario puede pedir un "botón rojo", pero el sistema necesita una "acción de cancelación global".
- **Detectar Sesgos Semánticos**: Si el usuario pide algo para "Proyectos", validar si en el giro de Alimentos (PFM) eso debería llamarse "Pedidos" o "Comandas".
- **Consulta al Roadmap**: Verificar obligatoriamente el archivo `roadmap.md`. ¿La tarea ya existe? ¿Está marcada como pendiente o completada? 
- **Sincronización de Roadmap**: Si la nueva solicitud no está en el roadmap, se debe incluir inmediatamente con una breve descripción y el tag `(Pendiente)` para garantizar su trazabilidad antes de planear.
- **Giro de Negocio**: Identificar si la solicitud es específica de un giro (Alimentos, Logística, Industrial) o si es una mejora core para todos.

### 2. Mapeo de Impacto y Reuso (Visión 360°)
No se debe modificar una función de forma aislada. Se debe:
- **Rastreo de Dependencias**: ¿Qué otras funciones llaman a este bloque? (Ej: Si cambio `checkout`, ¿se rompe el `checkoutStaff`?).
- **Principio DRY (Don't Repeat Yourself)**: ¿Ya existe una lógica similar? ¿Puedo refactorizar para que ambas usen la misma base?
- **Impacto en el Backend**: ¿La tabla en Google Sheets soporta este cambio? ¿Requiere una columna nueva que sea opcional para otros inquilinos?
- **Finalización de Transacción (CRÍTICO)**: Validar que si la función implica una venta o fin de flujo, se invoque `app.pos.clearCart()` para resetear totales, estados de envío y UI a cero. No permitir que estados residuales afecten la siguiente transacción.

### 3. Adaptación Semántica Dinámica
El sistema debe sentirse "nativo" para cada empresa:
- **Glosario Dinámico**: 
  - Si `app.state.isFood` es true: "Proyectos" -> "Pedidos", "Leads" -> "Clientes/Mesas", "Etapas" -> "Estado de Cocina".
  - Si es Industrial (Evasol): "Proyectos" -> "Instalaciones/Obras", "Leads" -> "Prospectos".
- **Lógica de Etiquetas**: Implementar o usar funciones que retornen el nombre de la etiqueta basado en el contexto de la empresa actual (`app.state.companyId`).

### 4. Entregable de Planeación
Antes de ejecutar la tarea, el agente debe presentar un breve **Plan de Acción** al usuario siguiendo este formato:
1. **Objetivo Real**: (Interpretación de la necesidad).
2. **Impacto en Sistema**: (Qué funciones se modifican y qué se reusa).
3. **Adaptación Multi-inquilino**: (Cómo se verá en diferentes giros).
4. **Sincronización de Roadmap**: (Confirmación de que la tarea está registrada o actualizada en `roadmap.md`).
5. **Riesgos**: (Posibles efectos secundarios).

### 5. Gestión de Consolidación de Workflows
Esta actividad es Crítica para mantener la base de conocimiento organizada y eficiente.
- **Responsabilidad de Integridad**: Al migrar un grupo de Workflows (ej. tablas, seguridad, utf8) a un Master Workflow (ej. `backend-core.md`), Planeación debe garantizar que el 100% del contenido original se preserve. **No se permite el resumen ni la pérdida de detalles técnicos.**
- **Nombrado de Archivos**:
  - **Master (Nuevo)**: Nombre claro y representativo (ej. `backend-core.md`).
  - **Obsoleto (Migrado)**: Se debe anteponer el prefijo `y` al nombre original (ej. `yarquitectura-tablas.md`) para marcarlo como procesado sin eliminarlo inmediatamente.
- **Reporte de Uso**: Los Master Workflows críticos (como `backend-core.md`) deben incluir una directiva explícita para reportar su ejecución al evaluador (`/evaluador`).

---
*Este workflow asegura que SuitOrg no sea un collage de parches, sino un ecosistema coherente y evolutivo.*
