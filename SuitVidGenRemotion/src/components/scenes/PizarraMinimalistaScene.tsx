import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img } from "remotion";
import type { TextScene } from "../../types/script";
import { rankingHeadlineFont } from "./rankingFonts";
import { AnimatedIcon } from "../AnimatedIcon";
import { itemBadgeText } from "./itemIcon";

const DEFAULT_BACKGROUND = "#FAFAF7";
const DEFAULT_INK = "#1A1A1A";
const DEFAULT_ACCENT = "#E23E3E";
// 3 pastel fijos ciclando por índice — mismo criterio que la referencia
// (mint/coral/amarillo pálido seccionando el contenido).
const PASTELS = ["#DCF3E6", "#FBE1DE", "#FCF3D0"];
const PASTEL_INK = ["#1F6B45", "#B0392C", "#8A6D14"];

// Si el icono es un check/cruz explícito, el color no cicla por posición:
// se fuerza mint (bien) o coral (mal) para que el color comunique el
// significado real del checklist en vez de ser puramente decorativo.
function pastelIndexFor(icono: string | undefined, fallbackIndex: number): number {
  // La IA no siempre escribe el glifo literal — a veces escribe la palabra
  // (ej. "checkmark", "cancel", "tick") en vez de "✓"/"✗" (visto en vivo
  // generando contenido real) — por eso se compara por substring, no exacto.
  const v = (icono || "").toLowerCase();
  if (icono === "✓" || v.includes("check") || v.includes("tick") || v === "si" || v === "yes") return 0;
  if (icono === "✗" || v.includes("cancel") || v.includes("cross") || v === "x" || v === "no") return 1;
  return fallbackIndex;
}

// Infografía "pizarra minimalista" (ver SuitReferencias/3018ddee27b6f0b0618
// 80cea8a3a696c.webp) — fondo blanco/crema, título negro con subrayado rojo,
// lista en bloques pastel rotativos (no tarjetas blancas neutras como Ranking
// en Tarjetas: aquí cada fila es un bloque de color de sección). Espera
// scene.items (content_shape: "lista"). Se activa con
// scene.visual_style === "pizarra_minimalista".
export const PizarraMinimalistaScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({ frame, fps, config: { damping: 9, mass: 0.6, stiffness: 180 } });
  const titleScale = interpolate(bounce, [0, 1], [0.6, 1]);
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const underlineDraw = interpolate(frame, [14, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const background = scene.brand_colors?.background || DEFAULT_BACKGROUND;
  const ink = scene.brand_colors?.ink || DEFAULT_INK;
  const accent = scene.brand_colors?.accent || DEFAULT_ACCENT;

  const items = (scene.items || []).slice(0, 6);
  // El guion real de ViRe (local-server-node.js) nunca llena scene.title —
  // el titular grande vive en texto_overlay (ver mismo comentario/fix en
  // PaperTextScene.tsx). Sin este fallback, un video real generado con IA
  // nunca muestra el titular: hallado en vivo generando un video de prueba.
  const headline = scene.title || scene.texto_overlay || scene.body;

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", padding: "64px 60px", justifyContent: "center" }}>
        {headline && (
          <div style={{ position: "relative", marginBottom: 40, transform: `scale(${titleScale})`, opacity: titleOpacity }}>
            <h1
              style={{
                fontFamily: rankingHeadlineFont,
                fontWeight: 800,
                fontSize: 48,
                lineHeight: 1.15,
                color: ink,
                margin: 0,
              }}
            >
              {headline}
            </h1>
            <svg width={220} height={10} style={{ position: "absolute", left: 0, bottom: -12 }}>
              <path
                d="M2 5 H218"
                stroke={accent}
                strokeWidth={6}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - underlineDraw}
              />
            </svg>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => {
            const start = 22 + i * 4;
            const opacity = interpolate(frame, [start, start + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const translateY = interpolate(frame, [start, start + 14], [14, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pastelIdx = pastelIndexFor(item.icono, i % PASTELS.length);
            const pastel = PASTELS[pastelIdx];
            const pastelInk = PASTEL_INK[pastelIdx];
            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  background: pastel,
                  borderRadius: 18,
                  padding: "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: pastelInk,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: rankingHeadlineFont,
                    fontWeight: 800,
                    fontSize: item.icono ? 18 : 15,
                  }}
                >
                  {itemBadgeText(item.icono, i)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: rankingHeadlineFont, fontWeight: 700, fontSize: 18, color: pastelInk }}>
                    {item.titulo_item}
                  </div>
                  <div style={{ fontFamily: rankingHeadlineFont, fontWeight: 400, fontSize: 14, color: ink, opacity: 0.75 }}>
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
            bottom: 24,
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
            background: "rgba(0,0,0,0.06)",
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
