import { AbsoluteFill, useCurrentFrame, interpolate, Img, spring } from "remotion";
import type { ProductScene } from "../types/script";

export const ProductScene: React.FC<{ scene: ProductScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const duration = Math.round(scene.duration * 30);
  const half = Math.floor(duration / 2);

  const imgZoom = spring({ frame, fps: 30, config: { damping: 20, stiffness: 60 } });
  const imgScale = 1 + imgZoom * 0.15;

  const textOpacity = interpolate(frame, [half - 10, half + 10], [0, 1]);
  const textSlide = interpolate(frame, [half - 10, half + 10], [30, 0]);
  const priceOpacity = interpolate(frame, [half + 15, half + 25], [0, 1]);

  const showImageFirst = duration > 20;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      }}
    >
      <AbsoluteFill style={{ display: "flex", flexDirection: "row" }}>
        {showImageFirst && scene.image_url && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${imgScale})`,
              overflow: "hidden",
            }}
          >
            <Img
              src={scene.image_url}
              style={{
                width: "90%",
                height: "90%",
                objectFit: "cover",
                borderRadius: 24,
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 50,
            opacity: textOpacity,
            transform: `translateY(${textSlide}px)`,
          }}
        >
          <h2
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "white",
              margin: "0 0 12px 0",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {scene.title}
          </h2>

          {scene.subtitle && (
            <p
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.6)",
                margin: "0 0 16px 0",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {scene.subtitle}
            </p>
          )}

          {scene.body && (
            <p
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,0.8)",
                lineHeight: 1.6,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {scene.body}
            </p>
          )}

          {scene.price && (
            <div
              style={{
                opacity: priceOpacity,
                marginTop: 20,
                fontSize: 40,
                fontWeight: 700,
                color: "#4ade80",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {scene.price}
            </div>
          )}
        </div>
      </AbsoluteFill>

      {!showImageFirst && scene.image_url && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Img
            src={scene.image_url}
            style={{
              width: "80%",
              height: "80%",
              objectFit: "contain",
              opacity: 0.3,
              borderRadius: 20,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
