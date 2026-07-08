import { AbsoluteFill, useCurrentFrame, interpolate, spring, Img, staticFile } from "remotion";
import type { IntroScene } from "../types/script";

export const IntroScene: React.FC<{ scene: IntroScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const duration = Math.round(scene.duration * 30);
  const half = Math.floor(duration / 2);

  const logoScale = spring({ frame, fps: 30, config: { damping: 12, stiffness: 90 } });
  const titleOpacity = interpolate(frame, [half - 10, half + 5], [0, 1]);
  const titleSlide = interpolate(frame, [half - 10, half + 5], [30, 0]);
  const subOpacity = interpolate(frame, [half + 10, half + 20], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        {scene.logo_url ? (
          <Img
            src={scene.logo_url}
            style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              objectFit: "contain",
              transform: `scale(${logoScale})`,
              marginBottom: 30,
              background: "rgba(255,255,255,0.1)",
              padding: 10,
            }}
          />
        ) : (
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: 40,
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${logoScale})`,
              marginBottom: 30,
              boxShadow: "0 20px 60px rgba(102,126,234,0.4)",
            }}
          >
            <span style={{ fontSize: 60, fontWeight: 900, color: "white" }}>V</span>
          </div>
        )}

        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "white",
              margin: 0,
              textShadow: "0 4px 20px rgba(0,0,0,0.3)",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {scene.title}
          </h1>

          {scene.subtitle && (
            <p
              style={{
                opacity: subOpacity,
                fontSize: 28,
                color: "rgba(255,255,255,0.7)",
                marginTop: 16,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 400,
              }}
            >
              {scene.subtitle}
            </p>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
