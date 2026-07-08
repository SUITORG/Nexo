import { AbsoluteFill, Sequence, useVideoConfig, useCurrentFrame } from "remotion";
import type { Script } from "./types/script";
import { SceneRenderer } from "./components/SceneRenderer";
import { SubtitleOverlay } from "./components/SubtitleOverlay";
import { AudioLayer } from "./components/AudioLayer";

export const ViReVideo: React.FC<{ script: Script }> = ({ script }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  if (!script || !script.scenes || script.scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: "#1a1a2e",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          fontSize: 32,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        No scenes defined
      </AbsoluteFill>
    );
  }

  let currentStartFrame = 0;
  const sceneTimings = script.scenes.map((scene) => {
    const durationFrames = Math.round(scene.duration * fps);
    const startFrame = currentStartFrame;
    currentStartFrame += durationFrames;
    return { startFrame, durationFrames };
  });

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AudioLayer
        scenes={script.scenes}
        sceneAudioFiles={(script as any).sceneAudioFiles ?? []}
        backgroundMusic={script.background_music}
        fps={fps}
      />

      {script.scenes.map((scene, i) => (
        <Sequence
          key={i}
          from={sceneTimings[i].startFrame}
          durationInFrames={sceneTimings[i].durationFrames}
        >
          <SceneRenderer scene={scene} />
        </Sequence>
      ))}

      {script.subtitles?.enabled && (
        <SubtitleOverlay scenes={script.scenes} script={script} />
      )}
    </AbsoluteFill>
  );
};
