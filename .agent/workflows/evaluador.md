---
description: Calibrador de preferencias y mejora continua del sistema basado en feedback post-implementación.
// turbo-all
---
# Workflow: Evaluador de Calidad y Aprendizaje

Este workflow se activa **después** de cada respuesta o implementación significativa. Su objetivo es observar la reacción del usuario, capturar patrones de diseño preferidos y retroalimentar al `Orquestador`.

### 1. Etapa de Calibración
El agente debe observar si la implementación requirió ajustes inmediatos:
- **Ajuste Estético**: ¿El usuario pidió cambiar un color o tamaño? (Ej: "Tarjetas 25% más pequeñas").
- **Ajuste Funcional**: ¿El usuario pidió mover un botón de lugar? (Ej: "WhatsApp al Header 1").
- **Ajuste de Flujo**: ¿El usuario prefirió un carrusel en lugar de una lista?

### 2. Registro de Lecciones (Memoria Adaptativa)
Cada patrón identificado se registra en `.agent/memory/lecciones.md` con el siguiente formato:
- **Preferencia**: El concepto aprendido (Ej: "Estética BK-Style").
- **Contexto**: En qué módulo o empresa aplica (Ej: "PFM / Temas de Comida").
- **Regla Implícita**: La instrucción técnica para el futuro (Ej: "Usar border-radius: 20px y botones flotantes sobre imágenes").

### 3. Sincronización Mandataria del Backend
Si se realiza una actualización en `backend_schema.gs`, el Evaluador debe forzar la actualización de su cabecera de auditoría con:
- **Versión**: Incremento semántico (ej: v3.6.4).
- **Fecha y Hora**: Formato YYYY-MM-DD HH:mm (Hora local del usuario).
- **Conteo de Líneas**: Total exacto de líneas del archivo.
- **Sincronía de Versión**: El Evaluador debe validar que el Frontend y el Backend hablen la misma versión para evitar fallos de protocolo.

### 4. Protocolo de No-Bloqueo
*Importante*: El Evaluador nunca debe rechazar una solicitud del usuario basándose en lecciones pasadas. Su función es **propiciar el mejor punto de partida**, pero siempre permitiendo la evolución del sistema.

---
*Este workflow cierra el ciclo de vida de cada tarea para asegurar que el sistema "envejezca" con sabiduría.*
