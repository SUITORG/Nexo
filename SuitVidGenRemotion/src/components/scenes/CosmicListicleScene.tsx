import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import type { TextScene } from "../../types/script";
import { paperHeadlineFont } from "./paperFonts";
import { pinterestHeadlineFont } from "./pinterestFonts";
import { AnimatedIcon } from "../AnimatedIcon";
import { itemBadgeText } from "./itemIcon";

const DEFAULT_BACKGROUND = "#120A2E";
const DEFAULT_ACCENT = "#F5B93E";
const DEFAULT_INK = "#FFFFFF";

// Genera un campo de estrellas determinístico (mismo resultado en cada frame
// del render, no aleatorio-por-frame) — evita el "parpadeo" que daría
// Math.random() dentro del render de Remotion.
const STARS = Array.from({ length: 28 }, (_, i) => {
  const seed = i * 137.51; // ángulo dorado, buena dispersión sin patrón visible
  return {
    left: (seed * 3.7) % 100,
    top: (seed * 5.3) % 100,
    size: 2 + (i % 3),
  };
});

// Lista tipo "cosmic listicle dorado" (ver SuitReferencias/2bae4b3693d734
// c02489beb01a162caf.webp) — fondo cósmico oscuro con estrellas, titular
// blanco impacto (Anton) y lista de puntos en una sola columna con ícono +
// título + subtítulo, separados por líneas finas. Espera scene.items (mismo
// content_shape: "lista" que Ranking en Tarjetas). Se activa con
// scene.visual_style === "cosmic_listicle_dorado".
export const CosmicListicleScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({ frame, fps, config: { damping: 9, mass: 0.6, stiffness: 180 } });
  const titleScale = interpolate(bounce, [0, 1], [0.6, 1]);
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const background = scene.brand_colors?.background || DEFAULT_BACKGROUND;
  const ink = scene.brand_colors?.ink || DEFAULT_INK;
  const accent = scene.brand_colors?.accent || DEFAULT_ACCENT;

  const items = (scene.items || []).slice(0, 7);
  // El guion real de ViRe (local-server-node.js) nunca llena scene.title —
  // el titular grande vive en texto_overlay (ver mismo comentario/fix en
  // PaperTextScene.tsx). Sin este fallback, un video real generado con IA
  // nunca muestra el titular: hallado en vivo generando un video de prueba.
  const headline = scene.title || scene.texto_overlay || scene.body;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 30% 20%, #2A1958 0%, ${background} 55%, #05030F 100%)`,
      }}
    >
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "white",
            opacity: 0.5 + (i % 4) * 0.12,
            boxShadow: "0 0 6px 1px rgba(255,255,255,0.5)",
          }}
        />
      ))}

      <AbsoluteFill style={{ display: "flex", flexDirection: "column", padding: "70px 64px", justifyContent: "center" }}>
        {headline && (
          <h1
            style={{
              fontFamily: paperHeadlineFont,
              fontWeight: 400,
              fontSize: 52,
              lineHeight: 1.08,
              color: ink,
              textShadow: `0 0 18px ${accent}66, 0 4px 0 rgba(0,0,0,0.4)`,
              margin: "0 0 40px",
              transform: `scale(${titleScale})`,
              opacity: titleOpacity,
            }}
          >
            {headline}
          </h1>
        )}

        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((item, i) => {
            const start = 20 + i * 5;
            const opacity = interpolate(frame, [start, start + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const translateX = interpolate(frame, [start, start + 15], [-20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateX(${translateX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "16px 0",
                  borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.18)" : "none",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.08)",
                    border: `1.5px solid ${accent}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: pinterestHeadlineFont,
                    fontWeight: 700,
                    fontSize: item.icono ? 22 : 18,
                    color: accent,
                  }}
                >
                  {itemBadgeText(item.icono, i)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: pinterestHeadlineFont, fontWeight: 700, fontSize: 22, color: ink }}>
                    {item.titulo_item}
                  </div>
                  <div style={{ fontFamily: pinterestHeadlineFont, fontWeight: 400, fontSize: 15, color: ink, opacity: 0.65 }}>
                    {item.subtitulo_item}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>

      {scene.texto_overlay && (
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: pinterestHeadlineFont,
            fontWeight: 700,
            fontSize: 16,
            color: accent,
            opacity: titleOpacity,
            textAlign: "center",
          }}
        >
          {scene.texto_overlay}
        </div>
      )}

      {scene.logo_url && (
        <Img
          src={scene.logo_url}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            width: 90,
            height: 90,
            objectFit: "contain",
            background: "rgba(255,255,255,0.85)",
            borderRadius: 12,
            padding: 8,
          }}
        />
      )}
      {scene.avatar_url && (
        <Img
          src={scene.avatar_url}
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            width: 90,
            height: 90,
            objectFit: "cover",
            borderRadius: "50%",
            border: "3px solid white",
          }}
        />
      )}

      {(scene.icono || scene.icono_svg) && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedIcon icono={scene.icono} svgMarkup={scene.icono_svg} animacion={scene.icono_animacion} size={32} />
        </div>
      )}
    </AbsoluteFill>
  );
};
