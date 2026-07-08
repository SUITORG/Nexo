import "./index.css";
import { Composition } from "remotion";
import { ViReVideo } from "./Composition";
import type { Script } from "./types/script";

const defaultScript: Script = {
  format: "custom",
  width: 1080,
  height: 1920,
  fps: 30,
  subtitles: { enabled: true, style: "tiktok" },
  scenes: [
    {
      type: "intro",
      duration: 2.5,
      title: "ViRe",
      subtitle: "Video con Remotion",
      animation: "fade_in",
      voice_text: "Bienvenido a ViRe, la generación de video con inteligencia artificial.",
    },
    {
      type: "text",
      duration: 3,
      body: "Crea videos profesionales con texto, imágenes y voz en segundos.",
      animation: "slide_up",
      image_prompt: "Futuristic technology interface with video editing tools, neon blue glow, digital art",
      voice_text: "Crea videos profesionales con texto, imágenes y voz en segundos.",
    },
    {
      type: "outro",
      duration: 2.5,
      cta: "Comienza ahora",
      contact_info: "ViRe - Video Remotion",
      animation: "fade_in",
      voice_text: "Comienza ahora y transforma tu contenido en videos impactantes.",
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ViReVideo"
        component={ViReVideo}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ script: defaultScript }}
        calculateMetadata={({ props }) => {
          const s = (props as { script: Script }).script;
          return {
            durationInFrames: s.scenes.reduce((sum, sc) => sum + Math.round(sc.duration * s.fps), 0),
            fps: s.fps,
            width: s.width,
            height: s.height,
          };
        }}
      />
    </>
  );
};
