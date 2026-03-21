---
description: Estándar para la creación y validación de módulos CRUD con control de acceso (RBAC)
---

Este workflow define los requisitos obligatorios para cualquier módulo de Gestión (CRUD) en la aplicación (Leads, Proyectos, Catálogo, etc.) para asegurar consistencia visual y seguridad.

### 1. Interfaz de Usuario (UI) Obligatoria:
- **Buscador:** Debe incluir un `div.search-box` con un icono de lupa `<i class="fas fa-search"></i>`.
- **Botón de Refresco:** Debe incluir un botón con `<i class="fas fa-sync-alt"></i>` que llame a `app.ui.refreshData()`.
- **Tablas:** La tabla debe ser responsiva (`table-responsive`) y usar la clase `data-table`.

### 3. Borrado Lógico (Soft Delete):
- **NO ELIMINAR:** Queda estrictamente prohibido realizar borrados físicos (`DELETE`) en la base de datos desde los módulos CRUD estándar.
- **Implementación:** El "borrado" debe consistir en cambiar el estado del registro (ej: `activo: false`, `estado: 'ELIMINADO'`).
- **Filtrado UI:** Las funciones de renderizado deben filtrar automáticamente los registros que no estén activos.
  ```javascript
  let list = app.data[type].filter(item => item.id_empresa === app.state.companyId && item.activo !== false);
  ```
- **Depuración:** El borrado físico real será ejecutado por un proceso de depuración automático programado en el servidor.

### 4. Búsqueda y Filtrado:
- **Prioridad Nombre:** La búsqueda por **Nombre** debe ser la más efectiva y sensible (usar `.toLowerCase()` y `.trim()`).
- **Multi-campo:** Además del nombre, debe permitir buscar por ID, teléfono o correo si aplica.

### 5. Control de Acceso por Nivel (RBAC):
- **Aislamiento Estricto:** Cada empresa tiene su propio "DIOS" (Nivel 10). El rango alto NO otorga acceso a datos de otras empresas.
- **Filtro Obligatorio:** Todos los usuarios, sin importar su nivel (incluyendo Nivel 10/DIOS), deben filtrarse estrictamente por `id_empresa === app.state.companyId`.
- **BORRAR (Lógico):** Solo visible si `nivel_acceso >= 10` dentro de la propia empresa.
- **DIOS GLOBAL:** Únicamente usuarios vinculados a `id_empresa === "GLOBAL"` pueden tener visibilidad multi-inquilino.
