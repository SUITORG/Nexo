# 🚀 ROADMAP Y MEJORA CONTINUA: Campañas AI

Este documento funciona como el cerebro persistente del proyecto, donde registramos el progreso hacia la automatización total, lecciones aprendidas y el estado actual de las funcionalidades para poder aplicarlas a futuros desarrollos.

## 📊 Progreso hacia el Objetivo Final (Publicación 100% Automática)
**Progreso Actual: 75%**

- [x] (20%) Base: Conexión frontend con Google Sheets como CMS ligero.
- [x] (40%) IA Generativa: Prompting avanzado dinámico con selección de Plantillas e Industrias.
- [x] (50%) Visualización: Pre-visualización de Slides con Fallbacks de servidor de Imágenes.
- [x] (60%) Producción 1 (Diseño): `html2canvas` para renderizado de textos embebidos en fotos estilo Reels.
- [x] (75%) Producción 2 (Audio): Web Speech API para TTS (Texto a Voz) gratuito.
- [x] (85%) Producción Visual 3: Limpieza estructural de Exportación (Ocultar UI elements, números e instrucciones durante descarga).
- [x] (90%) Audio Mezclado: Cerebro de "Producción Multimedia" con lógica interactiva (Voz, Música o Mix automatizado).
- [ ] (95%) Automatización de Video: Conectar el `reel-generator.js` con renders de FFmpeg/Node.
- [ ] (100%) Auto-Publicación Redes: Integración mediante API oficial o Zapier/Make directamente desde el Sheet.

---

## 🛠️ Lecciones de Ingeniería Aprendidas (Para futuros proyectos)

### 1. Robustez en Carga de Imágenes de IA (Fallbacks)
*   **Problema**: Los servicios gratuitos de IA de imágenes como Pollinations.ai a veces tienen tiempos de inactividad, lo que dejaba fondos negros.
*   **Solución (Implementada)**: Se desarrolló la función recursiva `tryLoadImage()` que recibe un vector de URLs. Si la IA falla, instantáneamente prueba proveedores gratuitos de respaldo como LoremFlickr o Picsum Photos usando promesas y `onerror`. Evita la mala experiencia del usuario.

### 2. Exportación de UI al Sistema de Archivos (`html2canvas`)
*   **Problema**: Necesitábamos descargar una composición visual compleja (Capa de imagen externa + Textos superpuestos por CSS + Filtros). 
*   **Solución (Implementada)**: Uso de bibliotecas de "screen capture" al vuelo (`html2canvas`) procesándolas con `useCORS: true` y control de retrasos (`setTimeout(500)`) para que los navegadores modernos (Chrome/Edge) no bloqueen las descargas simultáneas.

### 3. Síntesis de Voz Sin Costo Inicial
*   **Problema**: Integrar ElevenLabs u OpenAI Voice encarece el MVP antes de validar la herramienta.
*   **Solución (Implementada)**: El uso de *Web Speech API* integrado directamente en el navegador del usuario. Carga nula para el servidor de la app y un inicio de bajo costo inmejorable.

### 4. Inteligencia Contextual (Comandos de la IA)
*   **Problema**: La IA divagaba creando contenido irrelevante o con imágenes imposibles de procesar.
*   **Solución (Implementada)**: "Limpieza profunda de Prompts" antes del envío. Ej. en vez de `"An image of a lithium battery control room"`, enviar `["lithium battery", "professional background"]`. Uso de condicionales dinámicos (Ej. "Si hay Teléfono, aplica CTA Táctico; si no, aplica CTA Engagment").

### 5. Sanitización de Markdown y Expresiones Regulares (RegEx) en el DOM
*   **Problema**: La IA frecuentemente inyectaba Markdown (como `**1: Título**`) que rompía el frontend y estorbaba visualmente al generar gráficos finales para redes.
*   **Solución (Implementada)**: Implementar una rutina de Regex anidada (`replace(/^\s*[*#]*\s*(?:Slide|Diapositiva|\d+)?\s*[:.\-]?\s*/i, '').replace(/[*#]/g, '')`) para destruir formateros agresivos e instanciar solo cadenas de texto 100% limpias.

### 6. Paradoja de Identidad en Sugerencias Gráficas (El Evento "APE")
*   **Problema**: Nombres de empresa como *APE* (mono/primate en inglés) inyectados al Prompt provocaban alucinaciones en el modelo gráfico, insertando animales.
*   **Solución (Implementada)**: Aislamiento léxico en el maestro de Prompts: El nombre de la empresa fluye por el texto, pero se prohíbe en sugerencias visuales.

### 7. Complejidad Sensorial en Previsualización (Audio Overlap)
*   **Problema**: Al activar controles de producción multimedia (Voz vs Música), ambos se superponían de forma incontrolable o se ignoraban los selectores.
*   **Solución (Implementada)**: Se desarrolló un orquestador de audio interactivo. La bocina principal ahora evalúa 4 estados lógicos leyendo los "Toggles": Mute (Warning), Texto a Voz nativa, Música sola, o Mezcla dual (ducking del audio de música al 15% sobre la voz).

### 8. Lógica de Persuasión Extendida
*   **Problema**: Limitación en los enfoques de narrativa promocional comercial pura o exceso de información en memoria (front).
*   **Solución (Implementada)**: Adición de ingeniería de copywritting avanzada en el core del prompt instruyendo estilos agresivos de venta: "Dolor (Agitación)" y "Sentido de Escasez/Urgencia". Se incluyó un mecanismo global de reinicio (Clear Btn) que se enlaza directamente a la inicialización del DOM para desechar "basura virtual" entre sesiones. Se unificó este Vector ("aiTemplate") como inyección directa dentro del string de 'Status' para viajar al backend (Google Sheets).

### 9. Acondicionamiento Algorítmico de Videos (Reels)
*   **Problema**: Carencia de tratamiento diferencial entre los formatos de lectura pasiva (Posts) vs formatos vertiginosos de consumo rápido (Reels).
*   **Solución (Implementada)**: Bifurcación sistémica por Formato. Al detectar tipo 'Reel/Story', el módulo altera automáticamente la taza de reproducción vocal (Rate = 1.5x) para agilizar narrativa, y al realizar la orden de exportación del kit, empaqueta o renombra forzosamente el output generado bajo la envoltura digital (`.mp4`) preparándolo para consumo en editores de video oficiales de Meta/Tok, incluso sin el backend FFMpeg totalmente conectado.

---

## 📅 Próximos pasos pendientes y prioridades (Backlog)
- [x] Permitir subir Logo a nivel local con FileReader y Base64.
- [x] Ocultamiento dinámico (CSS) de elementos de UI durante la captura de `html2canvas`.
- [ ] Integración de motores de video para mezclar los clips con la voz generada.
- [ ] Opciones de subida directa (Auto-post) vía Webhooks / Zapier.
