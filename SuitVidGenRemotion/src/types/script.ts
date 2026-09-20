export type SceneType = 'intro' | 'text' | 'product' | 'outro';
export type VideoFormat = 'reel' | 'story' | 'post' | 'banner' | 'custom';
export type AnimationType = 'fade_in' | 'slide_up' | 'zoom_in' | 'ken_burns' | 'none';
export type IconAnimation = 'rotar' | 'flotar' | 'pulsar' | 'rebotar';

export interface SceneBase {
  type: SceneType;
  duration: number;
  animation?: AnimationType;
  voice_text?: string;
  sfx_file?: string;
  texto_overlay?: string;
  // Viene de video_subestilos.parametros_visuales.template (Supabase) — selecciona
  // un componente de escena alternativo en vez del look por defecto. Ver SceneRenderer.
  visual_style?: 'paper' | 'pinterest_ad' | 'ranking_tarjetas' | 'diario_ilustrado' | 'cosmic_listicle_dorado' | 'pizarra_minimalista';
  // Paleta exacta elegida por el usuario (armada o extraída del logo de la
  // empresa) — pisa los colores por defecto del template. Cada escena la
  // recibe igual (se fija una vez por video, como el estilo).
  brand_colors?: BrandColors;
  // Ícono contextual propuesto por el guion + su animación. `icono` es una
  // palabra clave en inglés (ej. "leaf", "clock") que el pipeline resuelve a
  // un SVG real de Iconify ANTES de renderizar (ver resolveAllIcons() en
  // scripts/helpers/iconProvider.js), recoloreado a brand_colors — el
  // resultado queda en `icono_svg`. Si `icono` ya es un emoji literal
  // (guiones viejos / pegados a mano), se deja tal cual y no se resuelve.
  // <AnimatedIcon> dibuja lo que haya: SVG si existe, si no el emoji de
  // `icono`. Ambos opcionales: no todas las escenas necesitan uno.
  icono?: string;
  icono_svg?: string;
  icono_animacion?: IconAnimation;
}

export interface BrandColors {
  background?: string;
  ink?: string;
  accent?: string;
}

// Un punto de una infografía tipo ranking/lista (video_subestilos.parametros_visuales
// .content_shape === "lista") — lo consume RankingTarjetasScene, no el TextScene genérico.
export interface RankingItem {
  icono?: string;
  titulo_item: string;
  subtitulo_item: string;
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
  // Solo lo lee RankingTarjetasScene (visual_style === "ranking_tarjetas") — el
  // resto de templates lo ignora, body sigue siendo el contrato normal.
  items?: RankingItem[];
  image_url?: string;
  image_prompt?: string;
  bg_color?: string;
  logo_url?: string;
  avatar_url?: string;
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
