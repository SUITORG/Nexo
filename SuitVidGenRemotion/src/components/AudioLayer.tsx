import { Audio, staticFile, Sequence } from "remotion";
import type { Scene } from "../types/script";

export const AudioLayer: React.FC<{
  scenes: Scene[];
  sceneAudioFiles: (string | null)[];
  backgroundMusic?: string;
  fps: number;
}> = ({ scenes, sceneAudioFiles, backgroundMusic, fps }) => {
  let currentStartFrame = 0;

  return (
    <>
      {backgroundMusic && (
        <Audio src={staticFile(backgroundMusic)} volume={0.15} loop />
      )}

      {scenes.map((scene, i) => {
        const audioFile = sceneAudioFiles?.[i];
        const durationFrames = Math.round(scene.duration * fps);
        const startFrame = currentStartFrame;
        currentStartFrame += durationFrames;

        if (!audioFile) return null;

        return (
          <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
            <Audio src={staticFile(audioFile)} volume={0.8} />
          </Sequence>
        );
      })}
    </>
  );
};
