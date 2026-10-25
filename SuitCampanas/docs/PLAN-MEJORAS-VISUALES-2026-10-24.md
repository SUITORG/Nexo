# Plan de mejoras visuales - SuitCampanas
**Fecha:** 2026-10-24
**Alcance revisado:** `C:\Users\rojo-\Downloads\SuitOrg\SuitCampanas` (copia activa, la que generó las piezas de hoy)
**Tipo:** diagnóstico + plan inicial. No se modificó código.

---

## 1. Resumen ejecutivo

El problema no es que la IA "escriba mal". El problema es que **la cadena visual no existe**:

- El alta de empresa dispara la campaña con `estilo_visual: null`.
- Las piezas se renderizan con una plantilla genérica de texto, no con un template de diseño.
- Los colores de marca no llegan al render.
- Las imágenes las genera Pollinations gratis, sin referencia de marca, con watermark y prompts genéricos.
- No hay control de calidad: se publican frases inventadas, imágenes repetidas y composiciones vacías.
- El botón "campaña con videos" del alta **no genera videos**: solo genera copy y, si acaso, imágenes.

Resultado: 12 PNG generados hoy, 0 MP4 de campaña. Las piezas se ven como diapositivas con una foto de stock aleatoria, no como publicidad de la empresa.

**Comparativa visual:** `docs/comparativa-actual-vs-gemini-2026-10-24.png` (pieza actual vs. prueba real con Gemini 3 Pro).

---

## 1.1 Estado de ejecución (2026-10-24, Fase 1)

Completado en código:

- `mascara.html` ya no manda `estilo_visual: null`; el servidor resuelve un estilo con template real si no viene.
- `approveMediaPlan()` auto-resuelve estilo (`resolveEstiloVisualForEmpresa`) y lo persiste en `planes_medios`.
- `runPiezaImgJob()` manda `visualTemplate` (no el nombre humano), `brand_colors` desde `color_tema` y usa primero las fotos reales del Brief (LAPVTFU).
- Gemini 2.5 Flash Image es el proveedor default (`generarImagenGemini`); Pollinations queda como fallback.
- `generators/static_renderer.py` (Pillow) renderiza las piezas estáticas en ~1-2 s, sin navegador.
- `SuitVidGenRemotion/scripts/render.js --still` ahora termina con `process.exit(0)`; antes el proceso quedaba colgado y el endpoint reportaba timeout de 90 s.
- 7/7 piezas de LABARIES regeneradas: 1080x1350 (Post/Story) y 1080x1080 (Banner), sin watermark, con foto real y paleta de marca.

Evidencia: `docs/comparativa-fase1-2026-10-24.png` y `docs/kit-labaries-fase1-2026-10-24.png` (7 piezas finales).

Pendiente inmediato de Fase 1: QA de copy/claims (ej. “puedes agenda”), rellenar body cuando el hook se repite, y probar con una segunda empresa.

---

## 2. Evidencia concreta

### 2.1 Piezas reales revisadas

| Pieza | Qué se ve | Problema |
|---|---|---|
| `descargas/LABARIES/pieza_C1-1.png` | Pasillo/oficina vacía y borrosa | No tiene relación con un laboratorio clínico. Watermark de Pollinations abajo a la derecha. |
| `descargas/LABARIES/pieza_C1-3.png` | Mujer genérica en una oficina | No muestra estudio, paciente ni resultados. Watermark. |
| `descargas/LABARIES/pieza_C1-4.png` | Set de fotografía con silla y banco | El prompt decía "estudio de laboratorio" y el modelo lo interpretó como **estudio fotográfico**. |
| `descargas/LABARIES/pieza_C1-7.png` | La misma imagen exacta que C1-4 | Prompt repetido + sin control de duplicados. |
| `descargas/SUITORG/pieza_C1-2.png` | Fondo azul plano con el texto "Elegir el software" | La imagen falló y cayó a fondo sólido; el texto es un fragmento de una lista, sin diseño. |

### 2.2 Código que causa el problema

| Archivo | Línea | Hallazgo |
|---|---|---|
| `mascara.html` | 486 | El alta de empresa llama a aprobar el plan con `estilo_visual: null`. Nunca elige estilo. |
| `local-server-node.js` | 1723 | Al renderizar una pieza manda `cj.visual_style` (texto libre del copy, ej. "Profesional y amigable") como `visual_style`. |
| `SuitVidGenRemotion/src/components/SceneRenderer.tsx` | 15-22 | Solo reconoce las claves `paper`, `pinterest_ad`, `ranking_tarjetas`, `diario_ilustrado`, `cosmic_listicle_dorado`, `pizarra_minimalista`. Cualquier otra cosa cae a `TextScene` (texto blanco centrado sobre foto). |
| `local-server-node.js` | 1725 | Los `brand_colors` solo se toman del JSON del copy. El schema de `CAMP-BRIEFMARKER` no incluye colores, así que casi siempre van vacíos. |
| `local-server-node.js` | 374 | La imagen por defecto es Pollinations Flux con `seed` aleatorio, sin imagen de referencia, sin producto, sin assets de la empresa. |
| `local-server-node.js` | 366 | El prompt de imagen se arma con `estilo_visual_keywords` + `visualDesc`; no hay `negative_prompt`, ni composición, ni reglas de marca. |
| `CAMP-BRIEFMARKER` (prompt en Supabase) | - | El schema pide `shot` genérico ("Persona en su escritorio", "Logo de la plataforma", "Botón de CTA") pero no un `image_prompt` en inglés, ni un `template`, ni un `asset` real. |
| `mascara.html` | 471-499 | Para `kind === 'video'` solo genera plan + piezas. No llama a ningún render de video. |
| `SuitMusic/scripts/music.py` | 27-80 | La "música" es un patrón de 4 beats con senos (kick/snare/hihat). No es música publicable. |
| `CAMP-CAMPAIGN-QA` (prompt en Supabase) | - | Pide un campo `qa` con score, pero el código no lo valida ni rechaza piezas con score bajo. |

### 2.3 Alucinaciones de copy detectadas

- LABARIES C1-2: menciona **"Con Claro"** (marca de telecom) en una pieza de laboratorio.
- SUITORG C1-1: afirma **"100+ clientes satisfechos"** sin que el brief lo respalde.
- SUITORG C1-2: usa **"Empresa XYZ"** y **"300% más eficiente"**, placeholders inventados.
- LABARIES C1-1: escribió **"¿¿¿Quién dijo..."** con triple signo.

No es solo estética: son claims y nombres que pueden meter a la empresa en un problema.

---

## 3. Causas raíz

1. **No hay un sistema visual de marca.** No existe un contrato de paleta, tipografía, logo, retícula, tono fotográfico y plantillas por empresa.
2. **El estilo no llega al render.** Aunque se elija un estilo, se manda el nombre humano en vez de la clave del template.
3. **No se usan los activos reales.** El brief de LABARIES ya trae logo, foto de agente y 6 imágenes de Drive; la campaña usa imágenes AI genéricas en vez de esas fotos.
4. **El proveedor de imagen es el más débil.** Pollinations gratis no compite con un modelo de imagen actual; además deja watermark.
5. **El copy y la dirección visual están mezclados.** El LLM escribe "shot" y "visual_style" en lenguaje vago; el renderer no puede convertirlo en diseño.
6. **No hay QA visual ni de claims.** Nada impide publicar una imagen vacía, repetida, con watermark o con una marca ajena.
7. **La automatización del alta está a medias.** Genera copy e imágenes, pero no videos, y no tiene gate de aprobación.

---

## 4. ¿Python o conexión a una IA?

**Respuesta corta: las dos, pero para cosas distintas.**

| Tarea | Con Python solo | Con IA | Recomendación |
|---|---|---|---|
| Definir un estilo de marca | No (requiere criterio) | Sí, un LLM propone; un humano aprueba | LLM + aprobación |
| Layout, tipografía, logo, CTA | Sí (HTML/CSS, Pillow, Remotion, FFmpeg) | No hace falta | **Determinista** |
| Fotos y fondos | Solo si usas modelos locales (ComfyUI/SDXL) | Sí (Gemini, Flux, Ideogram) | **IA** |
| Video | Sí para editar/ensamblar (FFmpeg, MoviePy) | Solo para planos especiales (Veo/Kling/Runway) | **Híbrido** |
| Copy | No | Sí (LLM) | **IA** |
| QA de imágenes y claims | Sí para reglas y detectar watermark/duplicados | Sí para juzgar si la imagen "tiene sentido" | **Ambos** |

### Lo importante

- **Python no inventa estilos.** Python puede renderizar un estilo si tú le das las reglas. El estilo tiene que vivir en un JSON/template, no en un prompt suelto.
- **Para imágenes sí necesitas un modelo AI.** El proyecto ya tiene `GEMINI_API_KEY` y esa llave tiene acceso a `gemini-3-pro-image` (Nano Banana Pro) y `gemini-2.5-flash-image`. Lo probé en vivo: genera una imagen limpia, realista, sin texto ni watermark, con espacio negativo para titular.
- **El código actual apunta a un modelo muerto.** `/api/ai/image` usa `imagen-3.0-generate-001:predict`; Google responde 404. Hay que cambiarlo a `gemini-3-pro-image` o `gemini-2.5-flash-image` vía `generateContent`.
- **Costo aproximado:** ~$0.04 USD por imagen con 2.5 Flash y ~$0.13 USD por imagen 1K/2K con 3 Pro (precio oficial de Google). 12 piezas = ~$0.50 a $1.60 USD. Es mucho más barato que seguir produciendo basura y rehacerla.
- **ComfyUI local** ya está instalado, pero en CPU tarda ~4 min por imagen. Sirve para pruebas o para zero-costo, no para producir 12 piezas por empresa en minutos.

---

## 5. Arquitectura objetivo

```text
Brief real (Config_Empresas + LAVTFU + SuitMaterial)
        │
        ▼
Brand Visual System (JSON por empresa)
  paleta · tipografía · logo · retícula · tratamiento de foto · plantillas · prohibiciones
        │
        ▼
Media Planner (LLM) → plan de medios
        │
        ▼
BriefMarker (LLM) → storyboard con:
  template_id · shot_type · image_prompt (inglés) · negative_prompt
  overlay corto · asset_url real · claim verificado · qa
        │
        ├── Renderer determinista (HTML/CSS o Remotion)
        │      texto, logo, CTA, color, retícula, animación
        │
        └── Imagen (solo el fondo/foto)
              1) activo real de la empresa
              2) Gemini image (con referencia de producto/logo)
              3) ComfyUI local
              4) stock
              5) fondo de marca + tipografía (nunca un frame vacío)
        │
        ▼
QA visual + QA de claims → aprobación humana → carpeta de revisión
```

### `Brand Visual System` (ejemplo de campos)

```json
{
  "id_empresa": "LABARIES",
  "palette": { "bg": "#F7FBFF", "ink": "#0B1B2B", "accent": "#00CCFF", "soft": "#E6F7FF" },
  "typography": { "display": "Inter Tight Bold", "body": "Inter Regular", "scale": [72, 48, 32, 24] },
  "logo": { "url": "...", "position": "top_left", "max_width": 180, "clearspace": 24 },
  "grid": { "margin": 64, "columns": 12, "gutter": 24 },
  "photo": { "treatment": "clean_bright", "duotone": null, "grain": 0.02 },
  "templates": ["clinical_editorial", "proof_card", "offer_stack", "faq_carousel"],
  "image_style": "fotografía editorial luminosa, luz suave de mañana, profundidad de campo, espacio negativo arriba",
  "negative_prompt": "texto, watermark, logo, manos deformes, dientes raros, marcas de agua, letras",
  "do_not": ["batas de laboratorio de stock", "sonrisas falsas", "neón", "claims sin fuente"]
}
```

### `Storyboard` (lo que debe devolver BriefMarker)

```json
{
  "template_id": "clinical_editorial",
  "scenes": [
    {
      "shot_type": "product_closeup",
      "image_prompt": "close-up of a blood test tube on a clean white surface, soft morning light, shallow depth of field, blue accent, no text, no logo",
      "negative_prompt": "text, watermark, logo, deformed hands",
      "asset_url": null,
      "overlay": "Resultados claros, sin vueltas",
      "duration_seconds": 4
    }
  ],
  "claims": [{ "text": "Resultados en 24 h", "source": "brief" }],
  "qa": { "score": 9, "brief_ok": true, "assets_ok": true, "claims_ok": true }
}
```

---

## 6. Plan inicial por fases

### Fase 0 - Congelar y medir (1 día)

- No generar más campañas automáticas hasta tener gate visual.
- Guardar 10 piezas actuales como "golden set" (antes/después).
- Medir: piezas con watermark, imágenes duplicadas, claims inventados, piezas vacías.
- Entregable: línea base + backup.

**Backup ya creado:** `C:\Users\rojo-\Downloads\SuitOrg\respaldos\SuitCampanas_pre_mejoras_2026-10-24_1912.zip`

### Fase 1 - Arreglar la tubería (2-3 días)

Objetivo: que el estilo, la paleta y los activos **sí lleguen** al render.

- Quitar `estilo_visual: null` del alta; elegir estilo automático o pedirlo.
- Mandar `template_id` (no el nombre humano) a `vire-still` y a VIDE.
- Mandar `brand_colors` desde `color_tema`/logo; no depender del JSON del copy.
- Usar primero los activos reales del brief (`LAVTFU`, `SuitMaterial`) antes de AI.
- Corregir el parser de URLs del logo (hoy puede romper el avatar por `;`).
- Re-renderizar las 10 piezas de LABARIES y comparar.

**Criterio de aceptación:** 10/10 piezas con logo completo, paleta de marca, texto legible, sin watermark, sin imágenes duplicadas.

### Fase 2 - Sistema de plantillas estáticas (3-4 días)

- 6 plantillas base: editorial clínico, prueba social, oferta, lista/ranking, antes/después, CTA.
- Cada plantilla con jerarquía, zonas seguras, logo, CTA y variantes de color.
- Render HTML/CSS (para estáticos) o Remotion `renderStill`.
- El LLM solo elige plantilla y escribe copy; no decide layout.

**Criterio de aceptación:** 12 piezas de una empresa aprobadas por Joel sin retocar a mano.

### Fase 3 - Motor de imágenes (3-5 días)

- Reemplazar Pollinations por Gemini image (`gemini-3-pro-image` para hero, `gemini-2.5-flash-image` para volumen).
- Si hay foto real del producto/persona, usarla como referencia en Gemini (image-to-image).
- Si no hay, generar fondo con Gemini y componer texto con template.
- Agregar `negative_prompt`, hash perceptual para detectar duplicados, y validación de watermark.
- Mantener ComfyUI como opción local/zero-costo.

**Criterio de aceptación:** 0 imágenes genéricas, 0 watermark, 0 duplicados, 0 claims inventados.

### Fase 4 - Video v2 (1 semana)

- Usar Remotion como motor principal, no FFmpeg slideshow.
- Estructura: hook 0-2 s, problema 2-5 s, prueba 5-10 s, oferta 10-15 s, CTA 15-20 s.
- Fotos reales + motion graphics + tipografía de marca + captions + música real.
- Música: librería con licencia o API de música generativa; no `music.py`.
- AI video solo para un plano hero si hace falta (Veo/Kling/Runway), no para todo.

**Criterio de aceptación:** 3 reels de 15-30 s que Joel pueda publicar sin editar.

### Fase 5 - Automatización del alta con gate (2-3 días)

- Agregar switch `marketing: auto | preguntar | skip` en la mácara.
- Después del alta: generar plan → **preview** → aprobar → piezas → QA → carpeta de revisión.
- Nunca publicar automáticamente a redes.
- Notificar a Joel con enlace a la carpeta y score de QA.

**Criterio de aceptación:** una empresa nueva llega a 12 piezas + 3 videos en revisión, sin intervención manual, y nada se publica sin aprobación.

---

## 7. ¿Necesito una skill especial?

**No hay una skill mágica que resuelva esto.** Lo que falta es una capa de dirección de arte y QA. Se puede construir con lo que ya hay:

- `aesthetic-preset-library` (ya instalada): sirve para anclar el estilo visual y evitar que el LLM invente "moderno" o "cinemático".
- `frontend-design` (ya instalada): para plantillas HTML/CSS de piezas estáticas.
- `remotion-*` (ya instaladas): para plantillas de video.
- `image_generate` / Gemini: para imágenes.
- `copywriter-meta` (en SuitOrg): para compliance de Meta, si se va a pautar.

**Lo que recomiendo crear:** una skill interna `campaign-visual-director` que haga exactamente:

1. Brief → `Brand Visual System` (JSON).
2. Plan → storyboard con `template_id`, `image_prompt`, `asset_url`, `overlay`.
3. QA de claims y QA visual.
4. Si el score < 8, regenerar o rechazar.

RUCP no es la pieza que falta; RUCP sirve para landing/GTM. Esto es otra capa.

---

## 8. Decisiones que necesito de Joel

1. **Empresas piloto:** propongo LABARIES y SUITORG (ya tienen piezas generadas hoy y brief real).
2. **Proveedor de imagen:** Gemini (recomendado, rápido y buena calidad) vs ComfyUI local (gratis pero ~4 min/imagen) vs API de pago (Flux/Ideogram).
3. **Video:** ¿motion graphics con fotos reales (recomendado para servicios/laboratorio) o video AI tipo Kling/Veo?
4. **Gate:** ¿quieres ver un preview de 4 piezas antes de generar las 12? Recomiendo sí.
5. **Presupuesto:** límite por campaña (ej. 12 imágenes Gemini 3 Pro ≈ $1.60 USD).

---

## 9. Rollback

- Backup completo: `C:\Users\rojo-\Downloads\SuitOrg\respaldos\SuitCampanas_pre_mejoras_2026-10-24_1912.zip`
- El repo git está limpio en `SuitCampanas` (solo `cache_trends.json` modificado).
- Antes de tocar código: crear rama `feat/campanas-visual-v2` y commit por fase.
- Si algo sale mal: restaurar el zip o volver a `main`.

---

## 10. Qué NO voy a hacer

- No voy a seguir generando campañas automáticas sin gate de calidad.
- No voy a publicar nada en redes.
- No voy a tocar credenciales ni la base de datos.
- No voy a reescribir todo el proyecto: primero arreglo la tubería y las plantillas, luego el video, luego la automatización.

---

## 11. Siguiente paso propuesto

Si apruebas el plan, empiezo por la **Fase 1**:

1. Crear rama y backup.
2. Arreglar `estilo_visual`, `template_id` y `brand_colors`.
3. Re-renderizar 10 piezas de LABARIES con los activos reales.
4. Entregarte una comparación antes/después y decidir si avanzamos a Fase 2.

Con eso sabremos en 2-3 días si el problema era de tubería (mi hipótesis) o si además hace falta cambiar el modelo de imagen.
