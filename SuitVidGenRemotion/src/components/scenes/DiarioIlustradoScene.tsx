import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import type { TextScene } from "../../types/script";
import { diarioHeadlineFont } from "./diarioFonts";
import { AnimatedIcon } from "../AnimatedIcon";
import { itemBadgeText } from "./itemIcon";

const DEFAULT_BACKGROUND = "#F3EDDD";
const DEFAULT_INK = "#2E3A6B";
const DEFAULT_ACCENT = "#6B3FA0";
const PAPER_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Infografía tipo "diario/cuaderno ilustrado a mano" (ver SuitReferencias/
// 101da3254cc29c6ebad850c4b7252950.webp) — papel crema + tinta azul/morada +
// letra tipo marcador (Kalam) + una nota adhesiva con el dato secundario +
// una fila opcional de "pasos" (si el guion trae items[], ranking_tarjetas-style
// content_shape) conectados con flechas, imitando la línea de tiempo dibujada
// a mano de la referencia. Se activa con scene.visual_style === "diario_ilustrado".
// Mismo contrato de props/overlays que PaperTextScene/RankingTarjetasScene.
export const DiarioIlustradoScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({ frame, fps, config: { damping: 9, mass: 0.6, stiffness: 170 } });
  const titleScale = interpolate(bounce, [0, 1], [0.55, 1]);
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const noteScale = interpolate(bounce, [0, 1], [0.7, 1]);

  const background = scene.brand_colors?.background || DEFAULT_BACKGROUND;
  const ink = scene.brand_colors?.ink || DEFAULT_INK;
  const accent = scene.brand_colors?.accent || DEFAULT_ACCENT;

  const mainText = scene.title || scene.texto_overlay;
  const note = scene.body;
  const steps = (scene.items || []).slice(0, 5);

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <AbsoluteFill style={{ backgroundImage: PAPER_TEXTURE, mixBlendMode: "multiply", opacity: 0.3 }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 70px" }}>
        {scene.image_url && (
          <div
            style={{
              width: 620,
              height: 380,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: `0 14px 0 rgba(0,0,0,0.06), 0 18px 34px rgba(46,58,107,0.25)`,
              border: `4px solid white`,
              transform: "rotate(1.2deg)",
              marginBottom: 36,
            }}
          >
            <Img src={scene.image_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {mainText && (
          <h1
            style={{
              fontFamily: diarioHeadlineFont,
              fontWeight: 700,
              fontSize: 58,
              lineHeight: 1.12,
              textAlign: "center",
              color: ink,
              margin: "0 0 18px",
              transform: `scale(${titleScale})`,
              opacity: titleOpacity,
            }}
          >
            {mainText}
          </h1>
        )}

        {note && (
          <div
            style={{
              position: "relative",
              maxWidth: 640,
              background: "#FFF3B8",
              color: "#3A3220",
              fontFamily: diarioHeadlineFont,
              fontSize: 22,
              lineHeight: 1.3,
              textAlign: "center",
              padding: "18px 26px",
              borderRadius: 4,
              transform: `rotate(-1.5deg) scale(${noteScale})`,
              boxShadow: "0 10px 22px rgba(0,0,0,0.18)",
              opacity: titleOpacity,
            }}
          >
            {note}
          </div>
        )}

        {steps.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 40 }}>
            {steps.map((item, i) => {
              const start = 22 + i * 4;
              const opacity = interpolate(frame, [start, start + 14], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, opacity }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "white",
                      border: `2.5px solid ${accent}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: diarioHeadlineFont,
                      fontSize: item.icono ? 24 : 18,
                      color: ink,
                      textAlign: "center",
                      padding: 4,
                    }}
                    title={item.titulo_item}
                  >
                    {itemBadgeText(item.icono, i)}
                  </div>
                  {i < steps.length - 1 && (
                    <svg width="30" height="14" viewBox="0 0 30 14">
                      <path d="M2 7 H24" stroke={accent} strokeWidth={2.5} strokeDasharray="4 4" />
                      <path d="M20 2 L26 7 L20 12" fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AbsoluteFill>

      {scene.logo_url && (
        <Img
          src={scene.logo_url}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            width: 100,
            height: 100,
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
            width: 100,
            height: 100,
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
            width: 66,
            height: 66,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedIcon icono={scene.icono} svgMarkup={scene.icono_svg} animacion={scene.icono_animacion} />
        </div>
      )}
    </AbsoluteFill>
  );
};
