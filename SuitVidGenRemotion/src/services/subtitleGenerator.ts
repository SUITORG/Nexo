import type { Scene, Script } from '../types/script';

export interface SubtitleEntry {
  text: string;
  startMs: number;
  endMs: number;
  words?: { text: string; startMs: number; endMs: number }[];
}

export function generateSubtitles(scenes: Scene[], script: Script): SubtitleEntry[] {
  const entries: SubtitleEntry[] = [];
  let elapsedMs = 0;

  for (const scene of scenes) {
    const sceneMs = scene.duration * 1000;
    const text = scene.voice_text || '';
    if (text) {
      const words = text.split(/\s+/).filter(Boolean);
      const wordDuration = words.length > 0 ? sceneMs / words.length : sceneMs;

      entries.push({
        text,
        startMs: elapsedMs,
        endMs: elapsedMs + sceneMs,
        words: words.map((word, i) => ({
          text: word + (i < words.length - 1 ? ' ' : ''),
          startMs: elapsedMs + i * wordDuration,
          endMs: elapsedMs + (i + 1) * wordDuration,
        })),
      });
    }
    elapsedMs += sceneMs;
  }

  return entries;
}
