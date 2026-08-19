import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { Scene, Script } from "../types/script";
import { generateSubtitles } from "../services/subtitleGenerator";

export const SubtitleOverlay: React.FC<{ scenes: Scene[]; script: Script }> = ({
  scenes,
  script,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;

  const entries = generateSubtitles(scenes, script);
  const currentEntry = entries.find(
    (e) => currentMs >= e.startMs && currentMs < e.endMs
  );

  if (!currentEntry) return null;

  const currentWord = currentEntry.words?.find(
    (w) => currentMs >= w.startMs && currentMs < w.endMs
  );

  const style: React.CSSProperties = script.subtitles?.style === "minimal"
    ? {
        background: "rgba(0,0,0,0.4)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: 22,
        fontFamily: "system-ui, sans-serif",
        color: "white",
      }
    : {
        background: "rgba(0,0,0,0.6)",
        borderRadius: 12,
        padding: "12px 24px",
        fontSize: 28,
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        color: "white",
        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
      };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 80,
        pointerEvents: "none",
      }}
    >
      <div style={style}>
        {currentEntry.words && currentWord
          ? currentEntry.words.map((w, i) => (
              <span
                key={i}
                style={{
                  color: w === currentWord ? "#fbbf24" : "white",
                  transition: "color 0.05s",
                }}
              >
                {w.text}
              </span>
            ))
          : currentEntry.text}
      </div>
    </AbsoluteFill>
  );
};
