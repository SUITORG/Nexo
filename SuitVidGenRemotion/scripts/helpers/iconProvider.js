// Resuelve scene.icono (propuesto por la IA, ver construirPromptGuion en
// SuitCampanas/script.js) a un ícono vectorial real de Iconify en vez de
// depender solo del emoji — la ventaja real: el SVG se puede recolorear al
// brand_colors exacto del cliente, un emoji nunca se puede recolorear.
//
// Compatibilidad hacia atrás: si scene.icono YA es un emoji real (guiones
// viejos guardados, o alguien pegó un JSON a mano con emoji), se detecta con
// \p{Extended_Pictographic} y se deja tal cual — AnimatedIcon sigue sabiendo
// dibujar emoji como texto. Solo se intenta resolver contra Iconify cuando
// parece una palabra clave (lo que la IA produce desde ahora).
const ICONIFY_SAFE_SETS = ['mdi', 'tabler', 'heroicons', 'ph', 'lucide', 'carbon', 'ic', 'fluent', 'ion', 'bi'];

function esEmoji(str) {
  return /\p{Extended_Pictographic}/u.test(str);
}

// Misma función que buscarIconoIconify() en SuitCampanas/local-server-node.js
// (duplicada a propósito, mismo criterio que ya existe entre ese archivo y
// este para Pexels — VIDE y ViRe son procesos Node separados, sin import
// compartido entre proyectos). Una sola palabra en la búsqueda: la API de
// Iconify es lógica Y entre términos, igual que Freesound — verificado en
// vivo que 2+ palabras casi siempre dan 0 resultados.
async function buscarIconoIconify(query, colorHex) {
  try {
    const simpleQuery = query.trim().split(/\s+/)[0];
    const searchUrl = `https://api.iconify.design/search?query=${encodeURIComponent(simpleQuery)}&prefixes=${ICONIFY_SAFE_SETS.join(',')}&limit=1`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const iconId = searchData.icons?.[0];
    if (!iconId) return null;
    const [prefix, name] = iconId.split(':');
    // Sin ?width=: el API devuelve width/height="1em" por default (verificado
    // en vivo) — encaja directo con el font-size que ya sizea el emoji en
    // AnimatedIcon.tsx, sin forzar un tamaño fijo aquí.
    const colorParam = colorHex ? `?color=${encodeURIComponent(colorHex)}` : '';
    const svgRes = await fetch(`https://api.iconify.design/${prefix}/${name}.svg${colorParam}`);
    if (!svgRes.ok) return null;
    return await svgRes.text();
  } catch (e) {
    console.warn(`[Iconify] Búsqueda falló: ${e.message}`);
    return null;
  }
}

// Devuelve { icono, icono_svg } por escena — nunca deja una palabra clave sin
// resolver como texto suelto en pantalla: si Iconify no encuentra nada, la
// escena se queda sin ícono (mismo criterio ya establecido: "sin ícono claro
// se queda con icono: null", no se fuerza uno feo).
async function resolveIcon(scene) {
  if (!scene.icono) return { icono: undefined, icono_svg: undefined };
  if (esEmoji(scene.icono)) return { icono: scene.icono, icono_svg: undefined };
  const color = scene.brand_colors?.accent || scene.brand_colors?.ink;
  const svg = await buscarIconoIconify(scene.icono, color);
  return svg ? { icono: undefined, icono_svg: svg } : { icono: undefined, icono_svg: undefined };
}

async function resolveAllIcons(scenes) {
  return Promise.all(scenes.map(resolveIcon));
}

module.exports = { resolveAllIcons, buscarIconoIconify, esEmoji };
