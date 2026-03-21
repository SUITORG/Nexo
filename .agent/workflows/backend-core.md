---
description: Maestro de Arquitectura Backend, Integridad de Datos, Multi-Inquilino y Seguridad.
---

# 🏗️ MASTER WORKFLOW: Backend Core Architecture

> **⚠️ REGLA DE ORO:** Siempre que se utilice este workflow, se debe reportar su ejecución a `/evaluador` para auditoría de cumplimiento.

Este documento consolida la verdad absoluta sobre **Arquitectura de Datos, Integridad, Multi-Tenancy, Seguridad y Estándares de Codificación**. Es la ley fundamental del sistema.

---

## 🔖 ÍNDICE DE CONTENIDOS (Workflows Consolidados)
1.  **Arquitectura de Tablas** (Gestión de esquema en Sheets)
2.  **Integridad Total** (Sincronización técnica y documental)
3.  **Sistema Multi-Inquilino** (Aislamiento entre empresas)
4.  **Seguridad API** (Protocolos OWASP y Secretos)
5.  **Estándar UTF-8** (Codificación Global)

---

## 1. 📂 ARQUITECTURA DE TABLAS

Este capítulo garantiza que la estructura de datos en Google Sheets sea coherente con la lógica del sistema y soporte el crecimiento multi-inquilino.

### 1.1. Definición de Esquema
Cada tabla debe seguir el estándar de SuitOrg:
- **id_empresa**: Primera columna obligatoria para aislamiento de datos.
- **id_clave**: Columna de identificación única (ej: id_lead, id_proyecto).
- **Consistencia**: Los nombres de columnas deben ser en minúsculas y sin espacios (snake_case) para facilitar el mapeo en JS.

### 1.2. Validación de Campos Críticos
Antes de añadir un campo:
- ¿Es específico de una empresa o es global?
- ¿Afecta al mapeo por cabeceras (`appendToSheetByHeader`)?
- ¿Requiere actualización en la función `initializeRbac` del backend?

### 1.3. Sincronización y Mantenimiento
1. **Auditoría de Columnas**: Las tablas deben tener exactamente los encabezados definidos en `backend_schema.gs`.
2. **Reparación Automática**: El botón "Reparar DB" debe invocar `initializeRbac` para crear columnas faltantes sin borrar datos existentes.
3. **Mapeo por Cabecera**: No Rely on physical column index. Always use `appendToSheetByHeader` for insertions.

### 1.4. Relación entre Tablas
- **Usuarios <-> Config_Roles**: Relación vía `id_rol` e `id_empresa`. 
- **Proyectos <-> Leads**: Relación vía `id_cliente`.
- **Pagos <-> Proyectos**: Relación vía `id_proyecto`.

### 1.5. Verificación de Integridad
- Ejecutar `Reparar DB` tras cualquier cambio en la estructura de `backend_schema.gs`.

---

## 2. 🔄 INTEGRIDAD TOTAL

Garantiza la integridad técnica (versiones) y documental (manuales/roadmap) del sistema. Unifica la sincronización técnica con la actualización de la documentación.

### 2.1. Sincronización Técnica (Versiones)
Este paso es **obligatorio** tras cualquier cambio en `app.js` o `backend_schema.gs`.

1.  **Actualizar Backend**:
    - Incrementar la versión en el encabezado de `backend_schema.gs`.
    - Actualizar Fecha y Hora de modificación.
    - Asegurar que `CONFIG.VERSION` coincida.
2.  **Auditoría de Líneas**:
    - Contar líneas reales de `app.js`, `style.css`, `index.html` y `backend_schema.gs`.
    - Actualizar el bloque "AUDITORÍA DE LÍNEAS" en el backend.
3.  **Aviso de Apps Script**:
    - Informar EXPLÍCITAMENTE al usuario que debe copiar el código al editor de Google Apps Script.
4.  **Verificación de Semillas (Seeds)**:
    - Asegurar que registros maestros (Agentes IA, Roles Críticos, SEO base) existan en el backend mediante lógica de "Upsert".
    - **Requisito**: La verificación debe ser por ID único del registro, no solo por si la tabla esta vacía.

### 2.2. Actualización Documental
Asegura que el conocimiento del sistema no se pierda.

1.  **Manual Técnico (`tech_manual.md`)**:
    - Actualizar estadísticas de líneas en la sección 8.
    - Documentar nuevas reglas de negocio o tablas si aplica.
2.  **Hoja de Ruta (`roadmap.md`)**:
    - Marcar tareas completadas.
    - Actualizar la versión actual en la base del documento.

### 2.3. Registro de Soluciones
Si el cambio solucionó un error o implementó una lógica compleja:
- Invocar `/optimizacion-recursos` para registrar la "Huella Digital".

---

## 3. 🏢 SISTEMA MULTI-INQUILINO

Este capítulo asegura que la aplicación funcione correctamente para múltiples empresas (inquilinos) sin que los cambios en una afecten a las demás.

### 3.0. Filosofía: Configuración antes que Personalización
**REGLA DE ORO:** Nunca modifiques código base para resolver una necesidad de una sola empresa. 
- **Malo:** `if (app.state.companyId === 'EMPRESA_X') { showEspecialFeature(); }`
- **Bueno:** `if (app.config.empresa.usa_funcionalidad_especial) { showEspecialFeature(); }` (Donde `usa_funcionalidad_especial` es una columna en `Config_Empresas`).

### 3.1. Aislamiento de Datos (Data Isolation) - **SERVER SIDE REINFORCED**
- **Principio Fundamental:** El Backend (`.gs`) es la única fuente de verdad y seguridad. Nunca confíes en que el Cliente (`app.js`) filtrará los datos correctamente.
- **Filtrado en Servidor (Server-Side Filtering):** 
    - Toda petición `GET` debe incluir obligatoriamente el parámetro `id_empresa`.
    - El script `doGet` debe filtrar las filas de la base de datos **ANTES** de devolver el JSON.
    - El JSON resultante solo debe contener registros donde `columna[0] == id_empresa`.
    - **Excepción:** La tabla `Config_Empresas` es pública y global para permitir el funcionamiento del Hub.
- **Prohibición de Filtrado en Cliente:** Queda prohibido enviar "todos los datos" al frontend y usar `.filter()` en Javascript para seguridad. Eso es solo para UX, no para seguridad.

### 3.2. Integridad de la Interfaz (UI Persistence)
- **Header y Footer Siempre Visibles:** El encabezado (`#main-header`) y el pie de página (si existe) NUNCA deben ocultarse, incluso si los datos de la empresa no se han cargado.
- **Fallbacks (Valores por Defecto):** Si un dato como el `slogan` o `logourl` está vacío en `Config_Empresas`, se debe mostrar un valor genérico o el nombre de la plataforma (SuitOrg) en lugar de dejar el espacio en blanco o roto.

### 3.3. Gestión de Contenido Vacío (Modo Remodelación)
Si un módulo o sección (ej. Galería, Catálogo de Productos) no tiene registros para la empresa actual:
- **Validación:** Comprobar si `list.length === 0`.
- **Mensaje de Bloqueo:** En lugar de mostrar una pantalla blanca o un error de consola, se debe inyectar un mensaje amigable:
  - *“🚧 Sección en Remodelación: Estamos preparando contenido increíble para ti. Vuelve pronto.”*
- **Persistencia de Navegación:** El usuario debe poder seguir navegando a otras secciones sin que la aplicación se congele.

### 3.4. Flujo de Validación de Cambios & Auditoría
- **Paso A:** Realizar el cambio para la empresa solicitante.
- **Paso B (Cruce):** Cambiar el `app.state.companyId` a una empresa diferente.
- **Paso C:** Verificar que la interfaz de la empresa B no haya cambiado y que no haya errores de "undefined" por falta de columnas o configuraciones nuevas.
- **Paso D (Políticas):** Confirmar que las políticas de `/politicas-creditos` y `/niveles-acceso` se aplican de forma aislada (ej. si una empresa es `GLOBAL` y otra `USUARIO`, el contador de la barra de estado debe cambiar de formato correctamente).

### 3.5. Coordinación de Workflows
Cualquier cambio en multi-tenancy debe ser verificado contra:
1.  **`/barra-estado`**: ¿Se muestra el ID de la empresa correcta?
2.  **`/estandar-crud`**: ¿Los datos que se crean/editan tienen el `id_empresa` correcto?
3.  **`/sincronizar-version`**: ¿Se actualizó la versión global sin romper los filtros de empresa?

### 3.6. Verificación de Seguridad
- Revisa que no existan llamadas a `app.data` sin filtrar por `id_empresa` en funciones de renderizado.
- Valida que las nuevas columnas en `Config_Empresas` tengan un valor por defecto para empresas existentes.

---

## 4. 🔒 SEGURIDAD API

Protocolo de Seguridad para APIs y Blindaje de Datos (OWASP Standards). DEBE ejecutarse antes de implementar cualquier nueva función que interactúe con el backend.

### 4.1. Cifrado y Transporte (HTTPS/TLS)
- **Regla:** Toda comunicación debe ser vía HTTPS. 
- **Acción:** Verificar que las URLs del backend (`google.com/macros/...`) no se degraden a HTTP y que el navegador no bloquee contenido mixto.

### 4.2. Autenticación y Secretos (Variables de Entorno)
- **Regla:** NUNCA harcodear llaves API, IDs de scripts o credenciales en `app.js` o `backend_schema.gs`.
- **Acción:** 
    - Toda llave debe vivir en **Propiedades del Script** (Apps Script) o un archivo **`.env`** (Local).
    - El archivo `.gitignore` DEBE incluir `.env` para evitar fugas en GitHub.
    - Mantener un archivo `.env.example` con los nombres de las variables pero SIN los valores, para referencia futura.
    - Asegurar que el archivo `.gitignore` oculte `backend_schema.gs` y archivos `.env`.

### 4.3. Autorización Granular (RBAC)
- **Regla:** Menos privilegios posibles (Principle of Least Privilege).
- **Acción:** Verificar en `Config_Roles` si el usuario tiene permiso explícito para el módulo o acción solicitada ANTES de ejecutar la llamada a la API.

### 4.4. Validación de Entrada (Sanitización)
- **Regla:** "No confíes en la entrada del usuario".
- **Acción:** 
    - En el Frontend: Limpiar caracteres especiales de inputs (XSS prevention).
    - En el Backend (`.gs`): Validar tipos de datos y rangos antes de escribir en Google Sheets (SQLi/Injection prevention).

### 4.5. Manejo de Errores Silenciosos
- **Regla:** No revelar arquitectura en errores.
- **Acción:** El backend debe devolver mensajes genéricos como "Error en el procesamiento" o "Acceso denegado" en lugar de fallos de línea o nombres de tablas de Sheets.

### 4.6. Rate Limiting y Control de Flujo
- **Regla:** Prevenir abuso.
- **Acción:** Implementar verificación de "Última actividad" en el usuario para evitar ráfagas de peticiones (DDoS mitigation).

### 4.7. Auditoría de Transacciones
- **Regla:** Todo deja rastro.
- **Acción:** Asegurar que cada escritura en el backend registre ID de Usuario, Timestamp e ID de Empresa.

---

## 5. 🌐 ESTÁNDAR UTF-8

Define la regla de oro para mantener la integridad de los datos y la visualización correcta de caracteres especiales (tildes, ñ, etc.) en todo el ecosistema multi-inquilino.

### 5.1. Regla de Oro
**Siempre configura todo (Base de datos, Script y HTML) en UTF-8 para que todos hablen el mismo "alfabeto".**

### 5.2. Directrices para el Desarrollador (IA y Humanos)
1. **Frontend (HTML)**: La etiqueta `<meta charset="UTF-8">` debe ser la primera dentro del `<head>`.
2. **Backend (Google Apps Script)**:
   - Todas las respuestas (`createTextOutput`) deben forzar el MimeType JSON y asegurar que el contenido sea un string UTF-8.
   - Usar `JSON.stringify()` para serializar datos y evitar caracteres moebius-bake.
3. **Persistencia (Google Sheets)**: Los datos insertados mediante `appendRow` o `setValues` deben ser limpiados de caracteres de control invisibles.
4. **Interacción con Archivos**: Queda prohibido el uso de scripts externos de limpieza (como .py) que puedan alterar el encoding al leer/escribir. Se debe usar el editor de código directamente con soporte UTF-8 nativo.

### 5.3. Prompt de Validación (Capa de Protección)
"Actúa como un experto en ingeniería de software. Al generar respuestas o procesar datos de entrada, asegúrate de:
- Forzar la salida de texto exclusivamente en formato UTF-8.
- Normalizar el texto eliminando caracteres de control invisibles o 'mojibake' (caracteres corruptos).
- Asegurarte de que las tildes y la letra 'ñ' estén correctamente codificadas.
- Si detectas caracteres extraños en los datos de entrada, límpialos antes de procesarlos.
- Si detectas carateres extraños en la landig page, límpialos antes de procesarlos "
