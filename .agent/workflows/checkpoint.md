---
description: Gestión de solicitudes, versiones de backend y aprobación de funcionalidades (Visto Bueno).
---
# Workflow: Checkpoint (Bitácora de Integridad)

Este workflow es el guardián de la memoria operativa del proyecto. Se asegura de que ninguna solicitud se pierda y que lo que ya funciona no se degrade.

### 1. Registro de Solicitud (Entrada)
Cada vez que el usuario solicita un cambio o función:
- Se registra en `.agent/memory/checkpoint_history.md` con estado `PENDIENTE`.
- Se identifica si requiere cambio de Backend (Versión).

### 2. Control de Versiones Backend
- Si se modifica `backend_schema.gs`, se incrementa la versión (vX.X.X).
- **Notificación Obligatoria**: El agente DEBE avisar explícitamente al usuario que el backend ha sido modificado y que requiere una "Nueva Implementación" en Apps Script.
- **Auditoría Interna**: Cada modificación en `backend_schema.gs` debe incluir un comentario en la parte superior con: **Versión, Fecha, Hora y Número total de líneas**.
- Se anota el cambio específico en el historial del Checkpoint.

### 3. Validación y "Visto Bueno"
- Tras implementar, se activa el `/evaluador`.
- Si el usuario confirma que funciona (Visto Bueno), el estado en la bitácora cambia a `VERIFICADO`.
- Si la función es crítica para el core, se marca como `CONGELADO` (Estado: ❄️).

### 4. Protocolo "No Tocar" (Inmutabilidad)
- **Regla de Oro**: Antes de cualquier nueva edición, el agente DEBE leer `checkpoint_history.md`. 
- Si una sección del código o una lógica está marcada como `CONGELADO`, el agente tiene prohibido modificarla a menos que el usuario lo solicite explícitamente para una refactorización.

### 5. Formato de Bitácora
El historial en `.agent/memory/checkpoint_history.md` debe mantenerse de **lo más nuevo a lo más antiguo**.

---
*Este workflow cierra el círculo de confianza entre el usuario y el agente.*
