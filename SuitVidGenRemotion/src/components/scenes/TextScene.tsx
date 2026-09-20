import { AbsoluteFill, useCurrentFrame, interpolate, Img } from "remotion";
import type { TextScene as TextSceneData } from "../../types/script";
import { AnimatedIcon } from "../AnimatedIcon";

export const TextScene: React.FC<{ scene: TextSceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
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

      {/* Miniaturas de logo/avatar sobre la imagen — mismo criterio que VIDE
          (CLAUDE.md): nunca un slide aparte. Misma posición/tamaño que el
          overlay de FFmpeg de VIDE (120px, 20px de margen) para que ambos
          motores se vean consistentes. */}
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
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(4px)",
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
