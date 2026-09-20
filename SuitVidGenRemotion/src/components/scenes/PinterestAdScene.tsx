import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import type { TextScene } from "../../types/script";
import { pinterestHeadlineFont, pinterestPriceFont, pinterestCursiveFont } from "./pinterestFonts";
import { AnimatedIcon } from "../AnimatedIcon";

const DEFAULT_BACKGROUND = "#FFFFFF";
const DEFAULT_INK = "#1A1A1A";
const DEFAULT_ACCENT = "#E11D2E";
// Turquesa y dorado son decoración fija del template (marco de foto, monedas),
// no identidad de marca — a diferencia de background/ink/accent no vienen de
// brand_colors. Igual criterio que PaperTextScene.
const TURQUOISE = "#17C3B2";
const GOLD = "#D4AF37";

const DRAW_START = 18;
const DRAW_END = 34;
const PRICE_RE = /\$[\d.,]+/;

// Look tipo pin de Pinterest clickbait (finanzas personales / trabajo desde
// casa): foto enmarcada en turquesa + titular grueso + cifra destacada +
// flecha ondulada + monedas + badge cursivo "Pinterest"/"Save this!". Se
// activa con scene.visual_style === "pinterest_ad" (parametros_visuales.template
// en video_subestilos) — ver SceneRenderer. Mismo contrato de props que
// TextScene/PaperTextScene para poder alternar sin tocar el resto del pipeline.
export const PinterestAdScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({ frame, fps, config: { damping: 9, mass: 0.6, stiffness: 180 } });
  const titleScale = interpolate(bounce, [0, 1], [0.6, 1]);
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const imageOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const imageScale = interpolate(frame, [0, 12], [0.92, 1], { extrapolateRight: "clamp" });

  const draw = interpolate(frame, [DRAW_START, DRAW_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeOpacity = interpolate(frame, [DRAW_END, DRAW_END + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeScale = interpolate(frame, [DRAW_END, DRAW_END + 10], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const background = scene.brand_colors?.background || DEFAULT_BACKGROUND;
  const ink = scene.brand_colors?.ink || DEFAULT_INK;
  const accent = scene.brand_colors?.accent || DEFAULT_ACCENT;

  // El guion real (local-server-node.js) no tiene un campo "price" separado
  // para escenas de texto — si el copy trae un monto ("$5,000"), se extrae
  // para renderizarlo como cifra destacada; si no hay monto, esa pieza se
  // omite en vez de inventar un número.
  const mainText = scene.title || scene.texto_overlay || scene.body;
  const priceMatch = mainText?.match(PRICE_RE)?.[0];
  const headline = priceMatch ? mainText!.replace(priceMatch, "").trim() : mainText;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "50px 60px",
      }}
    >
      {headline && (
        <h1
          style={{
            fontFamily: pinterestHeadlineFont,
            fontWeight: 900,
            textTransform: "uppercase",
            fontSize: 52,
            lineHeight: 1.1,
            textAlign: "center",
            color: ink,
            margin: "0 0 12px",
            transform: `scale(${titleScale})`,
            opacity: titleOpacity,
          }}
        >
          {headline}
        </h1>
      )}

      <div style={{ width: 200, height: 64, opacity: badgeOpacity }}>
        <svg width={200} height={64}>
          <path
            d="M 10 50 Q 60 8, 110 36 T 190 18"
            fill="none"
            stroke={accent}
            strokeWidth={7}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
        </svg>
      </div>

      {scene.image_url && (
        <div
          style={{
            position: "relative",
            width: 640,
            height: 640,
            borderRadius: 20,
            border: `10px solid ${TURQUOISE}`,
            overflow: "hidden",
            boxShadow: "0 20px 45px rgba(0,0,0,0.28)",
            transform: `scale(${imageScale})`,
            opacity: imageOpacity,
          }}
        >
          <Img src={scene.image_url!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

          {[
            { top: 24, left: 24 },
            { top: 24, right: 24 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                ...pos,
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, #FFE68A, ${GOLD})`,
                border: "2px solid rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: pinterestHeadlineFont,
                fontWeight: 900,
                color: "#5C4600",
                fontSize: 20,
                opacity: badgeOpacity,
              }}
            >
              $
            </div>
          ))}

          {priceMatch && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                right: 20,
                fontFamily: pinterestPriceFont,
                fontWeight: 700,
                fontSize: 44,
                color: accent,
                textShadow: "2px 3px 0 rgba(0,0,0,0.25)",
                transform: `rotate(-4deg) scale(${badgeScale})`,
                opacity: badgeOpacity,
              }}
            >
              {priceMatch}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 30,
          right: 30,
          background: accent,
          color: "#fff",
          padding: "8px 20px",
          borderRadius: 999,
          fontFamily: pinterestCursiveFont,
          fontSize: 30,
          transform: `rotate(4deg) scale(${badgeScale})`,
          opacity: badgeOpacity,
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)",
        }}
      >
        Pinterest
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 34,
          fontFamily: pinterestCursiveFont,
          fontSize: 34,
          color: ink,
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
        }}
      >
        Save this! 📌
      </div>

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
            padding: 10,
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
        // Debajo del badge "Pinterest" (top:30/right:30) — ese ya ocupa la
        // esquina, este va justo abajo para no encimarse.
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 30,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedIcon icono={scene.icono} svgMarkup={scene.icono_svg} animacion={scene.icono_animacion} size={30} />
        </div>
      )}
    </AbsoluteFill>
  );
};
