import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { IconAnimation } from "../types/script";

// Cada animación es un loop simple sobre `frame % N` — no depende de cuándo
// entra en escena, así que se ve igual de fluida sin importar el punto de
// captura (Solo Imagen usa un frame fijo, el video normal la reproduce entera).
const LOOP_FRAMES: Record<IconAnimation, number> = {
  rotar: 60,
  flotar: 90,
  pulsar: 45,
  rebotar: 50,
};

// Badge de ícono contextual + movimiento — el guion propone la palabra clave
// (ver construirPromptGuion en script.js), el pipeline la resuelve a un SVG
// real de Iconify antes de renderizar (ver iconProvider.js) y ese resultado
// llega aquí en `svgMarkup`, ya recoloreado a brand_colors. `icono` (emoji)
// es el modo legado — solo se usa si no hay `svgMarkup` (guiones viejos, o
// un emoji pegado a mano que nunca pasó por Iconify). rotar = proceso/tiempo/
// mecanismo, flotar = calma/naturaleza, pulsar = alerta/urgencia/latido,
// rebotar = energía/logro/diversión.
export const AnimatedIcon: React.FC<{
  icono?: string;
  svgMarkup?: string;
  animacion?: IconAnimation;
  size?: number;
}> = ({ icono, svgMarkup, animacion = "flotar", size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 10, mass: 0.6, stiffness: 160 } });
  const loopFrames = LOOP_FRAMES[animacion];
  const t = (frame % loopFrames) / loopFrames;

  let loopTransform = "";
  if (animacion === "rotar") {
    loopTransform = `rotate(${t * 360}deg)`;
  } else if (animacion === "flotar") {
    loopTransform = `translateY(${Math.sin(t * Math.PI * 2) * 8}px)`;
  } else if (animacion === "pulsar") {
    loopTransform = `scale(${1 + Math.sin(t * Math.PI * 2) * 0.12})`;
  } else if (animacion === "rebotar") {
    loopTransform = `translateY(${-Math.abs(Math.sin(t * Math.PI)) * 14}px)`;
  }

  const wrapperStyle: React.CSSProperties = {
    fontSize: size,
    lineHeight: 1,
    display: "inline-block",
    transform: `scale(${entrance}) ${loopTransform}`,
    transformOrigin: "center",
  };

  // React no permite dangerouslySetInnerHTML y children en el mismo elemento
  // a la vez (revienta con "Minified React error #60" aunque el children
  // evalúe a false) — de ahí las dos ramas en vez de un solo <div> condicional.
  if (svgMarkup) {
    // El SVG de Iconify trae width/height="1em" por default (sin ?width=
    // forzado, ver iconProvider.js) — hereda el tamaño de fontSize de este
    // div igual que ya hacía el emoji, sin lógica de tamaño aparte.
    return <div style={wrapperStyle} dangerouslySetInnerHTML={{ __html: svgMarkup }} />;
  }

  return <div style={wrapperStyle}>{icono}</div>;
};
