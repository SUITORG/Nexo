import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import type { TextScene } from "../../types/script";
import { rankingHeadlineFont } from "./rankingFonts";
import { AnimatedIcon } from "../AnimatedIcon";
import { itemBadgeText } from "./itemIcon";

const DEFAULT_BACKGROUND = "#FBF6EC";
const DEFAULT_INK = "#1E2A32";
const DEFAULT_ACCENT = "#E4572E";

// Infografía tipo "ranking en tarjetas" (N puntos con ícono+título+subtítulo,
// ver SuitReferencias/8bffd3321905ceba0f6a9a3c00112bb2.webp) — la foto de fondo
// es solo ambiente (blur + velo), las tarjetas cargan el contenido real. Se
// activa con scene.visual_style === "ranking_tarjetas" y espera scene.items
// (video_subestilos.parametros_visuales.content_shape === "lista" del lado
// del server arma esa lista desde el Brief). Mismo contrato de props/overlays
// que PaperTextScene/PinterestAdScene.
export const RankingTarjetasScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({ frame, fps, config: { damping: 9, mass: 0.6, stiffness: 180 } });
  const titleScale = interpolate(bounce, [0, 1], [0.6, 1]);
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const background = scene.brand_colors?.background || DEFAULT_BACKGROUND;
  const ink = scene.brand_colors?.ink || DEFAULT_INK;
  const accent = scene.brand_colors?.accent || DEFAULT_ACCENT;

  const items = (scene.items || []).slice(0, 8);
  const twoCols = items.length >= 4;
  // El guion real de ViRe (local-server-node.js) nunca llena scene.title —
  // el titular grande vive en texto_overlay (ver mismo comentario/fix en
  // PaperTextScene.tsx). Sin este fallback, un video real generado con IA
  // nunca muestra el titular: hallado en vivo generando un video de prueba
  // con los templates nuevos, mismo defecto heredado aquí sin detectar hasta ahora.
  const headline = scene.title || scene.texto_overlay || scene.body;

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      {scene.image_url && (
        <AbsoluteFill style={{ opacity: bgOpacity }}>
          <Img
            src={scene.image_url}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(6px) brightness(0.55)" }}
          />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ backgroundColor: background, opacity: scene.image_url ? 0.55 : 1 }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "70px 60px" }}>
        {headline && (
          <h1
            style={{
              fontFamily: rankingHeadlineFont,
              fontWeight: 800,
              fontSize: 50,
              lineHeight: 1.15,
              textAlign: "center",
              color: ink,
              margin: "0 0 36px",
              transform: `scale(${titleScale})`,
              opacity: titleOpacity,
            }}
          >
            {headline}
          </h1>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: twoCols ? "1fr 1fr" : "1fr",
            gap: 18,
            width: "100%",
          }}
        >
          {items.map((item, i) => {
            const start = 20 + i * 4;
            const opacity = interpolate(frame, [start, start + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const translateY = interpolate(frame, [start, start + 15], [16, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  background: "rgba(255,255,255,0.94)",
                  borderRadius: 16,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: accent,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: rankingHeadlineFont,
                    fontWeight: 800,
                    fontSize: item.icono ? 22 : 18,
                  }}
                >
                  {itemBadgeText(item.icono, i)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: rankingHeadlineFont, fontWeight: 700, fontSize: 19, color: ink }}>
                    {item.titulo_item}
                  </div>
                  <div style={{ fontFamily: rankingHeadlineFont, fontWeight: 400, fontSize: 14, color: ink, opacity: 0.72 }}>
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
            background: ink,
            color: "#fff",
            padding: "6px 18px",
            borderRadius: 999,
            fontFamily: rankingHeadlineFont,
            fontSize: 15,
            opacity: titleOpacity,
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
            background: "rgba(255,255,255,0.85)",
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
