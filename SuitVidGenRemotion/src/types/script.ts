export type SceneType = 'intro' | 'text' | 'product' | 'outro';
export type VideoFormat = 'reel' | 'story' | 'post' | 'banner' | 'custom';
export type AnimationType = 'fade_in' | 'slide_up' | 'zoom_in' | 'ken_burns' | 'none';

export interface SceneBase {
  type: SceneType;
  duration: number;
  animation?: AnimationType;
  voice_text?: string;
}

export interface IntroScene extends SceneBase {
  type: 'intro';
  title: string;
  subtitle?: string;
  logo_url?: string;
}

export interface TextScene extends SceneBase {
  type: 'text';
  title?: string;
  body: string;
  image_url?: string;
  image_prompt?: string;
  bg_color?: string;
}

export interface ProductScene extends SceneBase {
  type: 'product';
  title: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  image_prompt?: string;
  price?: string;
}

export interface OutroScene extends SceneBase {
  type: 'outro';
  cta: string;
  contact_info?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}

export type Scene = IntroScene | TextScene | ProductScene | OutroScene;

export interface VoiceConfig {
  provider: 'google_cloud' | 'edge_tts' | 'none';
  voice?: string;
  speed?: number;
}

export interface SubtitleConfig {
  enabled: boolean;
  style?: 'classic' | 'tiktok' | 'minimal';
  language?: string;
}

export interface Script {
  format: VideoFormat;
  width: number;
  height: number;
  fps: number;
  empresa?: string;
  tema?: string;
  voice?: VoiceConfig;
  background_music?: string;
  subtitles: SubtitleConfig;
  scenes: Scene[];
}

export interface EnrichedScript extends Script {
  sceneAudioFiles?: (string | null)[];
  sceneImageFiles?: (string | null)[];
}
