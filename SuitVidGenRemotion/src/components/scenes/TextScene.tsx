import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { TextScene } from "../types/script";

export const TextScene: React.FC<{ scene: TextScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const duration = Math.round(scene.duration * 30);
  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const slideUp = interpolate(frame, [0, 15], [40, 0]);

  const bgColor = scene.bg_color || "#1a1a2e";

  return (
    <AbsoluteFill style={{ background: bgColor }}>
      {scene.image_url && (
        <AbsoluteFill>
          <Img
            src={scene.image_url}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          {/* Gradiente solo detrás del texto: la foto se ve completa sin
              lavarse, el texto sigue legible sobre la zona oscurecida. */}
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.65) 100%)",
            }}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 60,
          opacity,
          transform: `translateY(${slideUp}px)`,
        }}
      >
        {scene.title && (
          <h2
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "white",
              margin: "0 0 20px 0",
              textAlign: "center",
              fontFamily: "system-ui, sans-serif",
              textShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            {scene.title}
          </h2>
        )}

        <p
          style={{
            fontSize: scene.title ? 32 : 40,
            fontWeight: 400,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            maxWidth: "85%",
            lineHeight: 1.5,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          {scene.texto_overlay || scene.body}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
