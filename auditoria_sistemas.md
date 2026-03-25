# INSTRUCCIÓN GLOBAL DE SEGURIDAD PARA EL AGENTE
**MODO ESTRICTO: NO EJECUTAR CÓDIGO.**
Actúa como un Arquitecto de Software Senior y Auditor de Seguridad. Tu tarea es ÚNICAMENTE LEER el repositorio actual, analizar la arquitectura y generar propuestas detalladas en formato de "Artefactos" (archivos Markdown de documentación). 
**REGLA DE ORO:** Tienes prohibido modificar archivos existentes, escribir código funcional, instalar dependencias o ejecutar comandos en la terminal. Tu única salida debe ser texto explicativo y planes de implementación.

Por favor, analiza mi proyecto actual y entrégame 4 propuestas separadas, clasificadas y enumeradas según los siguientes requerimientos:

### 1. [Arquitectura y Seguridad] Mejoras para el Sistema Multiinquilino (Tenants) y Perfiles
Analiza la estructura actual de mi base de datos y la lógica de usuarios. Genera una propuesta de las mejores prácticas para implementar:
*   **Aislamiento de datos:** Cómo asegurar que un inquilino (tenant) no pueda acceder a los datos de otro.
*   **Seguridad de Base de Datos:** Propuestas para implementar políticas de seguridad a nivel de fila (RLS en Supabase/Firebase) o Custom Claims.
*   **Roles y Permisos (RBAC):** Una propuesta para gestionar perfiles con distintos niveles de acceso, asegurando que las decisiones de autorización ocurran en el backend y no sean manipulables desde el frontend.

### 2. [Rendimiento y Escalabilidad] Optimización del Proyecto
Revisa la base del código actual y propón un plan de optimización enfocado en:
*   **Limpieza de deuda técnica:** Identificación de código redundante o ineficiente.
*   **Optimización de consultas:** Mejoras en la forma en que el frontend se comunica con la base de datos para reducir la latencia.
*   **Estructura de archivos:** Recomendaciones para modularizar mejor los componentes y separar la lógica de negocio de la interfaz de usuario.

### 3. [Integración IA] Conexión con el Servidor MCP de NotebookLM
Sabiendo que Antigravity soporta integraciones externas a través de servidores MCP (Model Context Protocol), elabora una propuesta teórica para conectar mi sistema con NotebookLM.
*   **Estrategia de conexión:** Cómo utilizar el MCP de NotebookLM para que mi aplicación pueda consultar libretas, documentos y PDFs como un centro de conocimiento (RAG).
*   **Flujo de datos:** Cómo estructurar la solicitud desde mi aplicación hacia la IA para aprovechar el contexto de NotebookLM sin exponer datos sensibles de los inquilinos.

### 4. [Experiencia de Usuario] Memoria de Sistema para Conversaciones con Clientes
Quiero dotar a mi aplicación de capacidades conversacionales (chats) con memoria a largo plazo para cada cliente. Diseña una propuesta de implementación que incluya:
*   **Esquema de Base de Datos:** Propuesta de tablas y relaciones para guardar el historial de chat vinculado al perfil de cada usuario y su respectivo inquilino (tenant).
*   **Gestión de Contexto:** Cómo estructurar y enviar el historial reciente a los modelos de lenguaje (LLMs) de forma eficiente para no exceder los límites de tokens.
*   **Lógica de recuperación:** Sugerencias sobre cómo implementar un sistema de memoria (por ejemplo, guardando resúmenes de conversaciones o utilizando embeddings) para mantener la continuidad en la atención al cliente.

**FORMATO DE ENTREGA ESPERADO:**
Entrégame el resultado de este análisis como un plan estratégico, dividiendo claramente tus respuestas en estas 4 categorías. No incluyas código de implementación directa, solo esquemas, arquitecturas sugeridas y el "paso a paso" de lo que deberíamos hacer en futuras fases.