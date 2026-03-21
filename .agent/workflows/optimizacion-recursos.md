---
description: Solución y optimización de recursos mediante memoria de tareas y errores.
---
# Workflow: Optimización de Recursos y Soluciones (Huella Digital)

Este workflow se activa para evitar la re-ejecución innecesaria de tareas y optimizar la resolución de errores recurrentes.

### 1. Recepción de Tarea Nueva
- **Huella Digital**: Genera una "huella digital" única (hash/identificador) basada en los parámetros y contexto de la tarea.
- **Consulta de Memoria**: ¿Ya resolví algo idéntico antes?
    - **SÍ**: Aplica la solución guardada instantáneamente. **FIN**.
    - **NO**: Continúa al paso 2.

### 2. Pre-ejecución (Memoria de Errores)
- **Búsqueda Preventiva**: Busca errores similares del pasado en la base de conocimientos técnica.
- **Aplicación de Parches**: Intenta aplicar las soluciones que funcionaron en esos casos históricos.
    - **SI FUNCIONA**: Registra el éxito y termina. **FIN**.
    - **SI FALLA**: Ejecuta la tarea normalmente.

### 3. Post-ejecución y Registro
- **Resultado FALLIDO**: Guarda el error con detalles:
    - ¿Qué pasó? (Stacktrace/Logs)
    - ¿Cuándo ocurrió? (Timestamp)
    - Reincidencia: ¿Cuántas veces ha ocurrido?
- **Resultado EXITOSO**: Guarda la solución completa (código/pasos) para re-uso futuro sin re-calcular.


### 5. Priorización Inteligente
- **Prioridad**: Resolver primero los errores más frecuentes.
- **Persistencia**: Mantener en memoria "caliente" las soluciones más usadas.
- **Métricas de Ahorro**: Registrar el tiempo estimado ahorrado por cada uso de solución cacheada.
### 6. Monitoreo de Hardware y Salud del Entorno (RAM/Disco/API)
Para evitar fallos catastróficos por falta de recursos físicos, se deben observar los siguientes indicadores:

| Recurso | Indicador de Alerta (Saturación) | Acción de Mitigación |
| :--- | :--- | :--- |
| **RAM (Contexto IA)** | Truncamiento de historial o error `ContextWindowExceeded`. | Cerrar archivos irrelevantes y procesar por fragmentos (`view_content_chunk`). |
| **Disco / Hardware** | Errores de escritura (`ENOSPC`) o timeouts en comandos de búsqueda. | Purga de archivos temporales y ejecución de `/recordatorio-mantenimiento` (Limpieza). |
| **Caché / API (Red)** | Errores HTTP 429 (Rate Limit) o 5xx (Backend Fail). | Pausar peticiones, activar fallback de modelos en `backend_schema.gs` y esperar cooldown. |
| **Procesamiento** | Lentitud extrema en respuestas o fallos de lectura de `app.js`. | Reducción de carga de archivos abiertos y simplificación de la tarea actual. |

### 7. Protocolo de "Pánico" (Recuperación de Memoria)
Si los recursos están al límite:
1.  **Compactar**: Resumir el estado actual en `roadmap.md` y cerrar todos los archivos secundarios.
2.  **Purgar**: Eliminar logs de más de 60 días en el backend (ver manual técnico).
3.  **Reiniciar Contexto**: Si la IA pierde el hilo, solicitar al usuario un "Resumen de Objetivo" para limpiar el buffer de memoria.
