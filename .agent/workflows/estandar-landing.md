---
description: Estándar integral para la Landing Page (Barra de Estado, Cuerpo y Footer).
---

# 🛡️ Workflow: Estandar Landing (MANDATORIO)

Este workflow consolidado es la **Especificación Técnica Maestra** para la Landing Page. Cualquier intervención en `app.ui.renderHome` o el Header debe cumplir con todos los puntos aquí listados. **Este estándar es INMUTABLE.**

---

## 1. BARRA DE ESTADO (Header Staff) - [CRÍTICO]
*Fuente de verdad para el estado de sesión y licenciamiento.*

### Elementos Obligatorios (Orden Izquierda a Derecha):
1.  **Indicador BS-T:** Texto `BS-T` estático.
2.  **Usuario:** `app.data.Session.username` o "Visitante".
3.  **Nivel de Acceso (`#sb-level`):** Únicamente el número (ej: `5`, `10`). **PROHIBIDO** prefijos como "Nivel:".
4.  **Rectángulo de Conexión (`#sb-console`):** Consola visual de sincronización.
5.  **Versión:** Prefijo `V: ` + valor dinámico del backend (ej: `V: 3.3.7`).
6.  **Fecha:** Formato `AAMMDD-hhmm`.
7.  **Créditos / Fecha Límite:** 
    *   Si es por saldo: `$ ` + `creditos_totales`.
    *   Si es por tiempo: `fecha_limite_acceso`.

### Reglas de Implementación:
*   **Función Central:** `app.ui.updateStatusBar()` gestiona la actualización.
*   **Fondo:** Oscuro (`#1a202c`), texto blanco con alto contraste.

---

## 2. CUERPO DE LA PÁGINA (Hero & Matriz SEO) - [INMUTABLE]

Este bloque asegura el impacto visual y el posicionamiento orgánico. No debe omitirse bajo ninguna circunstancia si los datos existen en la configuración.

### 2.1 Hero Banner Premium
- **Propósito**: Captar la atención del usuario al cargar la página.
- **Contenido**:
    - **Imagen de Fondo**: Debe ser de alta resolución, relacionada con el giro del negocio. Se obtiene de la configuración de la empresa (`Config_Empresas.banner_url`).
    - **Título (H1)**: Mensaje principal de la empresa (Slogan o Propuesta de Valor).
    - **Subtítulo (P)**: Breve descripción de los servicios.
    - **Call to Action (CTA)**: Botón principal que dirija a la acción más relevante (ej. "Ver Catálogo" o "Contáctanos").
- **Estilo**: Efectos de gradiente oscuro sobre la imagen para asegurar legibilidad del texto blanco, transiciones suaves al cargar.

### 2.2 Matriz SEO (Long-Tail SEO) - [DETALLE TÉCNICO MANDATORIO]
- **Propósito:** Posicionamiento por nichos.
- **Datos Dinámicos:** Extraídos obligatoriamente de:
    - `Config_Empresas.seo_titulo`
    - `Config_Empresas.seo_descripcion`
    - `Config_Empresas.seo_items` (array de objetos con `titulo`, `descripcion`, `foto`).
- **Resiliencia de Renderizado:**
    - **Caso A (Con Fotos):** Grid de tarjetas con imágenes de fondo y overlay de texto.
    - **Caso B (Sin Fotos):** Grid de tarjetas minimalistas usando iconos temáticos o iniciales estilizadas. **PROHIBIDO** dejar espacios vacíos o fotos rotas.
- **Visibilidad:** Si `seo_items` tiene datos, la sección **DEBE** renderizarse. Si está vacío, se oculta elegantemente.

---

## 3. FOOTER INSTITUCIONAL (Barra Única) - [ESTÁNDAR VISUAL]

### 3.1 Diseño Minimalista
- **Barra Única:** Fondo `#0F0F0F`. **PROHIBIDO** bloques apilados.
- **Distribución:** Flexbox `space-between` entre [Copyright] --- [Enlaces] --- [Iconos Sociales].
- **Padding:** `20px 5%`.

### 3.2 Enlaces e Interacción
- **Enlaces:** Contáctanos, Opiniones, Pilares, Nosotros, Políticas, Ubicación.
- **Redes Sociales:** Fondos cuadrados semi-transparentes. Hover con colores oficiales:
  - Facebook: `#1877F2` | Instagram: Gradiente | TikTok: `#000000`.
- **Timer de Inactividad:** En modales secundarios (Nosotros, Políticas), el sistema debe ejecutar un `setTimeout` de 30-45s para cerrar y volver a `#home`.

---

## Protocolo de Verificación Final
Antes de finalizar la tarea, el agente DEBE confirmar visualmente (o mediante inspección de código) **las 3 partes anatómicas de la página**:

1.  **HEADER (Barra de Estado):**
    - [ ] ¿Tiene el formato `V: X.X.X`?
    - [ ] ¿El indicador de créditos muestra el saldo correcto?

2.  **BODY (Cuerpo Central - CRÍTICO):**
    - [ ] **Hero Banner:** ¿Se muestra la imagen de fondo y el slogan principal (`h1`)?
    - [ ] **Matriz SEO:** ¿Se ejecuta `app.ui.renderSEO()`?
        - **Validación de Datos:** Si `Config_SEO` tiene registros, la sección `#industrial-solutions-seo` **DEBE** estar visible (sin clase `.hidden`).
        - **Validación de Loop:** Verificar que el contenedor `.solutions-grid` tenga hijos (tarjetas).

3.  **FOOTER:**
    - [ ] ¿Es una sola barra negra minimalista?

4.  [ ] **Invocar al /evaluador** para confirmar que la fidelidad técnica se mantuvo al 100%.

// turbo
### Comandos de Validación:
1. `grep -E "seo_titulo|seo_items" app.js` (Para asegurar que la lógica de renderizado está presente).
2. `grep "updateStatusBar" app.js` (Para validar la estructura del header).
3. `grep "renderSEO" js/modules/ui.js` (Confirmar llamada explícita).
