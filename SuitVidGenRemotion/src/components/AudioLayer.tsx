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

        return (
          <Sequence key={i} from={startFrame} durationInFrames={durationFrames}>
            {audioFile && <Audio src={staticFile(audioFile)} volume={0.8} />}
            {scene.sfx_file && <Audio src={staticFile(scene.sfx_file)} volume={0.9} />}
          </Sequence>
        );
      })}
    </>
  );
};
