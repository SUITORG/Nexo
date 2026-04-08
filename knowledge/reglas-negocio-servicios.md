# 🛡️ Blindaje de Regla de Negocio: MASTER LÓGICA (v16.3.6)

## 📌 Pilares de Negocio (Inamovibles)
Esta regla garantiza que las empresas tipo 'Servicios', 'Marca Personal' y los módulos operativos mantengan su funcionalidad e interfaz sin degradaciones.

## 🚥 Reglas Inquebrantables (Invariantes UI)

### 1. Detección de Identidad (Servicios y Marca Personal)
Cualquier comparación del tipo de negocio debe ser **insensible a mayúsculas/minúsculas**.
- **Servicios:** `String(co.tipo_negocio).toUpperCase() === 'SERVICIOS'`
- **Marca Personal:** `String(co.tipo_negocio).toUpperCase().includes('MARCA PERSONAL')`
- **Origen de Datos:** Columna `tipo_negocio` en la tabla `Config_Empresas`.

### 2. Procesos Operativos (Blindaje de Flujo)
Los siguientes módulos son el núcleo del sistema y su lógica de transacciones NO debe ser simplificada:
- **`POS / CAJA`**: Gestión de ventas, cierre de turno y reportes de ingreso.
- **`POS / EXPRESS`**: Flujo de comandas rápidas para alimentos y snacks.
- **`TRACKING PROJECT`**: Seguimiento de hitos, estados de obra y entregables de proyectos.

### 2. Comportamiento Orbit (Burbujas)
Las empresas de tipo Servicios **DEBEN aparecer en la Órbita**, aplicando los filtros de:
- `habilitado`: TRUE.
- `es_visible_hub`: TRUE.
- `modo`: PROD (esconder en modo TEST).

### 3. Matriz SEO (La Pasarela de Servicios)
- **Capa de Cristal (Glass Overlay):** Es obligatorio activar el `seo-glass-overlay` que muestra la lista de sub-servicios y el botón de acción principal.
- **Navegación Vertical (A):** Al hacer clic en la tarjeta o botón, el destino **SIEMPRE** debe ser la página individual del servicio (`targetHash`).
- **Puntero:** Toda la tarjeta debe tener `cursor: pointer` y ser clicable en su totalidad para mejorar la UX.

### 4. Página Dinámica de Servicios
Cuando el sistema carga un servicio individual:
- **Prioridad de Contenido:** El banner/hero principal (logo) debe enviarse al **final de la página** (`order: 99`) para no interrumpir la lectura.
- **Ocultación de Matriz:** La Matriz SEO se oculta automáticamente para centrar la atención del usuario en el texto y fotos del servicio específico.

---
**⚠️ ADVERTENCIA:** Esta lógica es el núcleo de conversión de los negocios de consultoría del ecosistema. **NO simplificar bajo el pretexto de optimización de código.**
