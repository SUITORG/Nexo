---
description: Generador de metadatos SEO y contenido estructurado JSON para la tabla Config_Paginas.
---

Este workflow automatiza la creación de los 4 campos críticos para las landing pages del sistema, asegurando minificación técnica y optimización SEO de alto impacto.

### 🛠️ Pasos de Ejecución

1. **Definición de Insumos**:
   - Proporciona al asistente: `id_pagina`, `keyword_principal`, `dolor_negocio` y **`nom_empresa`** (ej: APE, Grupo Evasol, etc.).

2. **Generación de Opciones Estratégicas**:
   - El asistente generará **3 opciones de Título y Metadescripción**.
   - Títulos: `< 60 caracteres`.
   - Descripciones: `150-155 caracteres`.
   - Tono: Persuasivo/Urgente (enfocado en evitar pérdidas económicas).

3. **Arquitectura de JSONs (Minificados)**:
   - Una vez elegida la opción, el asistente generará los strings definitivos en una sola línea para:
     - **meta_json**: SEO tags y keywords.
     - **schema_json**: Grafo completo (Organization, Service, FAQ).
     - **contenido_json**: Estructura UI completa (Intro, Cuerpo, FAQs) hasta 500 palabras.

4. **Validación y Aplicación**:
   - El resultado será una tabla de 4 columnas lista para copiar y pegar directamente en GSheets o Supabase.

---
*Powered by SuitOrg AI Architect v16.10.30*
