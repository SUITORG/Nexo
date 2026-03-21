# 🧠 Manual del Motor de Contenido Dinámico (v6.2.0)

Este manual explica cómo administrar el contenido narrativo y el SEO de cada cliente de forma independiente utilizando la tabla `Config_Paginas`.

## 1. ¿Para qué sirve?
Permite que un mismo sitio web muestre diferentes textos, títulos y configuraciones de Google (SEO) dependiendo del cliente o de la sección que se visite, sin necesidad de programar.

---

## 2. Estructura de la Tabla `Config_Paginas`
Crea una hoja en tu Google Sheets llamada **`Config_Paginas`** con las siguientes columnas exactas:

| Columna | Descripción | Ejemplo |
| :--- | :--- | :--- |
| **id_empresa** | ID único del cliente. | `IS21` |
| **id_pagina** | Identificador de la sección. | `home`, `museo`, `servicios` |
| **meta_json** | SEO: Título de pestaña y descripción. | Ver ejemplo abajo. |
| **schema_json** | SEO Google: Datos estructurados (ONG, Museo, etc). | Ver ejemplo abajo. |
| **contenido_json**| Lo que el humano ve: H1, H2, Párrafos. | Ver ejemplo abajo. |

---

## 3. Ejemplo Práctico (JSON)

### Bloque: `meta_json`
Controla cómo se ve tu sitio en la pestaña del navegador y en los resultados de búsqueda.
```json
{
  "title": "Inclusión Siglo 21 — Apoyo a Personas con Discapacidad",
  "description": "Organización no lucrativa en México que apoya a personas con discapacidad visual.",
  "keywords": ["ONG", "México", "Inclusión"]
}
```

### Bloque: `contenido_json`
Controla el texto visual en la sección "Historia Dinámica".
```json
{
  "H1": "Título Principal de Impacto",
  "H3_1": "Subtítulo de apoyo",
  "p_intro": "Este es el párrafo principal que explica la misión...",
  "cta_texto": "Botón de Acción (Ej: Donar)",
  "cta_secundario": "Botón Secundario (Ej: WhatsApp)"
}
```

---

## 4. Navegación Dinámica
El sistema genera URLs automáticamente basadas en el `id_pagina`:
*   Si el id es `home`, se muestra en la página principal.
*   Si el id es `museo`, el usuario puede entrar mediante: `tusitio.com/#museo`.

El sistema ocultará automáticamente el Banner de bienvenida para que la "Historia Dinámica" sea la protagonista en las subpáginas.

> [!TIP]
> **Prioridad Visual:** El contenido dinámico aparece justo arriba de la Galería, dándole contexto a las fotos que ya tienes configuradas.

---
*Documento generado por Antigravity AI para SuitOrg v6.2.0.*
