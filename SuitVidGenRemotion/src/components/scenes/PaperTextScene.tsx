import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import type { TextScene } from "../../types/script";
import { paperHeadlineFont } from "./paperFonts";
import { AnimatedIcon } from "../AnimatedIcon";

const DEFAULT_ACCENT = "#E8722C";
const DEFAULT_INK = "#2B2118";
const DEFAULT_BACKGROUND = "#F4E9D8";
const PAPER_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const DRAW_START = 20;
const DRAW_END = 38;

// Alternativa de look a TextScene (fondo foto + degradado oscuro): papel
// crema + Anton + rebote + subrayado tipo marcador. Se activa con
// scene.visual_style === "paper" (video_subestilos.parametros_visuales.template
// en Supabase) — ver SceneRenderer. Mismas props/contrato que TextScene para
// poder alternar entre ambas sin tocar el resto del pipeline (voz, imagen, overlays).
export const PaperTextScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({ frame, fps, config: { damping: 9, mass: 0.6, stiffness: 180 } });
  const titleScale = interpolate(bounce, [0, 1], [0.5, 1]);
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const draw = interpolate(frame, [DRAW_START, DRAW_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const imageOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const imageScale = interpolate(frame, [0, 12], [0.9, 1], { extrapolateRight: "clamp" });

  const background = scene.brand_colors?.background || DEFAULT_BACKGROUND;
  const ink = scene.brand_colors?.ink || DEFAULT_INK;
  const accent = scene.brand_colors?.accent || DEFAULT_ACCENT;

  const hasImage = Boolean(scene.image_url);
  // El guion real de ViRe (local-server-node.js) nunca llena scene.title —
  // el texto de la escena viaja en texto_overlay/body. Ese es el titular
  // grande con rebote+subrayado, no un párrafo aparte (si no, el look nuevo
  // nunca se vería en producción).
  const mainText = scene.title || scene.texto_overlay || scene.body;
  const contentWidth = hasImage ? 900 : 800;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: background }}>
      <AbsoluteFill style={{ backgroundImage: PAPER_TEXTURE, mixBlendMode: "multiply", opacity: 0.35 }} />

      <div style={{ width: contentWidth, display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
        {hasImage && (
          <div
            style={{
              width: contentWidth - 100,
              height: 420,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 18px 40px rgba(43,33,24,0.25)",
              transform: `rotate(-1.5deg) scale(${imageScale})`,
              opacity: imageOpacity,
              marginBottom: 48,
            }}
          >
            <Img src={scene.image_url!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {mainText && (
          <div style={{ position: "relative", width: contentWidth - 40, textAlign: "center" }}>
            <h1
              style={{
                fontFamily: paperHeadlineFont,
                fontSize: hasImage ? 46 : 60,
                fontWeight: 400,
                color: ink,
                margin: 0,
                letterSpacing: 0.5,
                lineHeight: 1.15,
                transform: `scale(${titleScale})`,
                opacity: titleOpacity,
              }}
            >
              {mainText}
            </h1>
            <svg
              width={contentWidth - 40}
              height={32}
              viewBox={`0 0 ${contentWidth - 40} 32`}
              style={{ position: "absolute", left: 0, bottom: -20 }}
            >
              <path
                d={`M 16 16 Q ${(contentWidth - 40) / 2} 3, ${contentWidth - 56} 14`}
                fill="none"
                stroke={accent}
                strokeWidth={10}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - draw}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Mismo contrato que TextScene: overlays de logo/avatar como miniatura
          sobre la composición, nunca un slide aparte (CLAUDE.md). */}
      {scene.logo_url && (
        <Img
          src={scene.logo_url}
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            width: 120,
            height: 120,
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
            width: 120,
            height: 120,
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
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.5)",
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
