import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { OutroScene } from "../types/script";

export const OutroScene: React.FC<{ scene: OutroScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const duration = Math.round(scene.duration * 30);
  const half = Math.floor(duration / 2);

  const ctaOpacity = interpolate(frame, [0, 15], [0, 1]);
  const ctaScale = interpolate(frame, [0, 15], [0.5, 1]);
  const infoOpacity = interpolate(frame, [half - 5, half + 5], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {scene.logo_url && (
        <Img
          src={scene.logo_url}
          style={{
            width: 80,
            height: 80,
            objectFit: "contain",
            position: "absolute",
            top: 40,
            left: 40,
            opacity: 0.5,
          }}
        />
      )}

      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "white",
            margin: "0 0 10px 0",
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {scene.cta}
        </h2>

        <div
          style={{
            width: 100,
            height: 4,
            background: "linear-gradient(90deg, #667eea, #764ba2)",
            borderRadius: 2,
            margin: "20px auto",
          }}
        />
      </div>

      <div
        style={{
          opacity: infoOpacity,
          textAlign: "center",
          marginTop: 30,
        }}
      >
        {scene.contact_info && (
          <p
            style={{
              fontSize: 22,
              color: "rgba(255,255,255,0.7)",
              margin: "4px 0",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {scene.contact_info}
          </p>
        )}
        {scene.phone && (
          <p
            style={{
              fontSize: 26,
              color: "rgba(255,255,255,0.9)",
              margin: "4px 0",
              fontFamily: "system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            {scene.phone}
          </p>
        )}
        {scene.website && (
          <p
            style={{
              fontSize: 18,
              color: "#667eea",
              margin: "4px 0",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {scene.website}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
