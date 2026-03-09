# 🏗️ Backend Schema Documentation (SuitOrg v6.2.8)

## 📌 Resumen Técnico
Este documento define la estructura y el comportamiento del motor de backend de **SuitOrg**, operando sobre **Google Apps Script (GAS)** y utilizando **Google Sheets** como base de datos relacional multi-inquilino.

**Versión Actual:** 6.2.8 (Gallery Navigation, Slider & Transition UI)
<b>Última Actualización:</b> 2026-03-09

---

## 🗃️ Estructura de Datos (Tablas)

### 1. Tablas Globales (`GLOBAL_TABLES`)
Tablas compartidas entre todas las empresas para configuración del Hub y autenticación.
*   **Config_Empresas**: Metadata de inquilinos, colores, temas. **v6.2.7**: Soporte para `mensaje1`, `mensaje2` (Marca Personal) y `DRIVE_ROOT_ID`.
*   **Config_Paginas**: **v6.2.7**: Motor de contenido dinámico robusto. Almacena JSON de Meta, Schema y Narrativa con limpieza automática de caracteres especiales.
*   **Config_Galeria**: Gestión de imágenes, logos y visuales por empresa.
*   **Config_Roles**: Definición de permisos RBAC y módulos visibles.
*   **Usuarios**: Credenciales, niveles de acceso y saldos de créditos. **v6.1.8**: Soporta login mediante Token de Bóveda.
*   **Config_SEO**: Matriz de palabras clave y soluciones para la Landing Page.
*   **Prompts_IA**: Configuración de agentes Gemini.

### 2. Tablas Privadas (`PRIVATE_TABLES`)
Datos aislados por `id_empresa`. El acceso a estas tablas debe filtrarse estrictamente en el servidor.
*   **Leads**: Prospectos comerciales. **v6.1.8**: Gatillo automático para expedientes digitales.
*   **Proyectos**: Órdenes de trabajo y ventas. Utiliza el estándar de folio `ORD-XXX`.
*   **Catalogo**: Inventario y servicios. Utiliza el prefijo `PROD-XX`.
*   **Logs**: Registro de auditoría y fallos de IA.
*   **Pagos**: Transacciones financieras vinculadas a empresas y proyectos.

---

## 🛠️ Acciones de API (POST Protocol)

El backend responde a las siguientes acciones mediante el orquestador principal:

| Acción | Descripción | Reglas de Negocio |
| :--- | :--- | :--- |
| `createLead` | Crea un prospecto nuevo. | **v6.1.8**: Si es TopLux, auto-crea Usuario y Token de Bóveda. |
| `syncDrive` | Inicializa estructura de Drive. | Crea carpetas Maestras y 00_BIBLIOTECA_IA. |
| `uploadToVault` | Sube archivos a Drive. | Convierte Base64 a Blob y lo guarda en la carpeta del Cliente. |
| `getCustomerDocs` | Lista archivos privados. | Filtra archivos en la carpeta de Drive del usuario logueado. |
| `processFullOrder` | Transacción atómica de POS. | Registra Lead, Venta y descuenta Stock en un solo paso. |

---

## 🔒 Lógica de Bóveda (Vault Engine v6.1.8)
1.  **Gatillo**: Al detectar un `createLead` de una empresa financiera, el sistema genera un `vaultToken` de 6 dígitos (`TX-XXXX`).
2.  **Identidad**: Se crea una fila en la tabla `Usuarios` con `nivel_acceso: 1` y el token como password.
3.  **Drive Hierarchy**: El sistema organiza los archivos en:
    * `01_EXPEDIENTES_CLIENTES` / `[Nombre Cliente]` / `01_IDENTIDAD`, `02_SOLICITUDES`, etc.

---

## 🔒 Reglas Inmutables de Integridad
1.  **Aislamiento**: Ninguna petición puede recuperar datos que no pertenezcan al `id_empresa` autenticado (excepto tablas globales).
2.  **Seguridad Drive**: El acceso a archivos externos solo se permite mediante `getCustomerDocs` validado por token de sesión.
3.  **Identificadores**: Los IDs técnicos son secuenciales y no aleatorios (LEAD-101, ORD-501).
4.  **Borrado Lógico**: No se eliminan filas físicamente; se usa una columna `activo` (TRUE/FALSE) para persistencia histórica.

---
*Documento mantenido automáticamente por Antigravity AI.*
