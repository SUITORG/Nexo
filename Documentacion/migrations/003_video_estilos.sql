-- 003_video_estilos.sql
-- Categorías y sub-estilos visuales para VIDE + sistema de tendencias (director)

CREATE TABLE IF NOT EXISTS video_categorias_estilo (
  id SERIAL PRIMARY KEY,
  id_empresa TEXT NOT NULL,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  descripcion TEXT,
  icono TEXT DEFAULT '🎨',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug, id_empresa)
);

CREATE TABLE IF NOT EXISTS video_subestilos (
  id SERIAL PRIMARY KEY,
  id_categoria INTEGER NOT NULL REFERENCES video_categorias_estilo(id) ON DELETE CASCADE,
  id_empresa TEXT NOT NULL,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  descripcion TEXT,
  keywords_ia TEXT,
  parametros_visuales JSONB DEFAULT '{}',
  tendencia_base INTEGER DEFAULT 50,
  activo BOOLEAN DEFAULT TRUE,
  UNIQUE(slug, id_categoria, id_empresa)
);

CREATE TABLE IF NOT EXISTS video_tendencias_estilo (
  id SERIAL PRIMARY KEY,
  id_subestilo INTEGER NOT NULL REFERENCES video_subestilos(id) ON DELETE CASCADE,
  id_empresa TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  puntuacion INTEGER NOT NULL DEFAULT 50,
  fuente TEXT DEFAULT 'manual',
  UNIQUE(id_subestilo, id_empresa, fecha)
);

-- RLS
ALTER TABLE video_categorias_estilo ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_subestilos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tendencias_estilo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS video_categorias_estilo_select ON video_categorias_estilo;
CREATE POLICY video_categorias_estilo_select ON video_categorias_estilo
  FOR SELECT USING (id_empresa = current_setting('app.id_empresa', true) OR id_empresa = 'ALL');

DROP POLICY IF EXISTS video_subestilos_select ON video_subestilos;
CREATE POLICY video_subestilos_select ON video_subestilos
  FOR SELECT USING (id_empresa = current_setting('app.id_empresa', true) OR id_empresa = 'ALL');

DROP POLICY IF EXISTS video_tendencias_estilo_select ON video_tendencias_estilo;
CREATE POLICY video_tendencias_estilo_select ON video_tendencias_estilo
  FOR SELECT USING (id_empresa = current_setting('app.id_empresa', true) OR id_empresa = 'ALL');

-- Seeds (6 grupos del usuario × 3-4 sub-estilos cada uno)
-- Reemplaza la versión inicial de 4 categorías con los grupos reales que el
-- negocio y la generación de video requieren.
DELETE FROM video_tendencias_estilo;
DELETE FROM video_subestilos;
DELETE FROM video_categorias_estilo;

INSERT INTO video_categorias_estilo (id_empresa, nombre, slug, descripcion, icono) VALUES
  ('ALL', 'Tipografía y Letras', 'tipografia', 'Tipografía brutal, letras gigantes, bold kinetic typography, lyrics karaoke viral, cartel urbano latino', '🔤'),
  ('ALL', 'Avatar y Personajes', 'avatar', 'Avatares cartoon pop, 3D estilo Pixar/Disney, stickers animados para reels', '🧑‍🎨'),
  ('ALL', 'Formas Dulces', 'formas-dulces', 'Gummy 3D, candy 3D, blobs gelatinosos, letras con textura de caramelo, formas suaves y brillantes', '🍬'),
  ('ALL', 'Edits al Beat', 'edits-beat', 'Beat-synced photo montage, cinematic beat reels, slideshow festival con cortes al ritmo de la música', '🎵'),
  ('ALL', 'Promo Comercial', 'promo', 'Social ad style latam, bloques de color con frases de venta, sticker & emoji overload estilo TikTok', '📢'),
  ('ALL', 'Latino Virales', 'latino-virales', 'Latin party reel, reggaeton promo, urban street ad, festival aftermovie — estilos virales latinos', '🔥')
ON CONFLICT (slug, id_empresa) DO NOTHING;

-- Sub-estilos resuelven su categoría por slug (JOIN)
INSERT INTO video_subestilos (id_categoria, id_empresa, nombre, slug, descripcion, keywords_ia, tendencia_base)
SELECT c.id, v.id_empresa, v.nombre, v.slug, v.descripcion, v.keywords_ia, v.tendencia_base
FROM (VALUES
  -- 1) Tipografía y Letras
  ('tipografia', 'ALL', 'Bold Kinetic Typography', 'bold-kinetic', 'Letras enormes, colores neón, texto que entra y sale al ritmo de la música', 'bold kinetic typography, giant letters, neon colors, text synced to beat, latin music', 70),
  ('tipografia', 'ALL', 'Lyrics / Karaoke Viral', 'lyrics-karaoke', 'Texto de la canción aparece palabra por palabra con el beat, típico de reels', 'lyric video, large clean typography, words entering on beat, reggaeton, colorful animated background', 75),
  ('tipografia', 'ALL', 'Cartel Urbano Latino', 'cartel-urbano', 'Tipografía tipo cartel de concierto o flyer de reggaetón, mucho color y textura', 'latin urban poster, thick dirty typography, red and yellow colors, text animation with zoom and shake', 65),

  -- 2) Avatar y Personajes
  ('avatar', 'ALL', 'Avatar Cartoon Pop', 'avatar-cartoon-pop', 'Personaje caricatura cabeza grande, ojos expresivos, muy colorido', 'cartoon pop avatar, 2D caricature, vibrant colors, exaggerated expressions, dancing to music', 70),
  ('avatar', 'ALL', 'Avatar 3D Pixar', 'avatar-3d-pixar', 'Look premium tipo película animada, ideal para protagonista de marca', 'pixar style 3D avatar, studio lighting, looking at camera, singing on beat, head movements synced', 80),
  ('avatar', 'ALL', 'Avatar Sticker Reels', 'avatar-sticker', 'Personaje con contorno blanco grueso tipo sticker que aparece y desaparece', 'sticker style avatar, thick white outline, fast movements, appearing in different positions with text', 60),

  -- 3) Formas Dulces
  ('formas-dulces', 'ALL', 'Gummy 3D / Candy 3D', 'gummy-3d', 'Formas suaves y brillantes como gomitas o jelly, aspecto juguetón', 'gummy 3D shapes, neon colors, bright lighting, bouncing shapes on beat, jelly candy style', 65),
  ('formas-dulces', 'ALL', 'Blob Dance', 'blob-dance', 'Figuras abstractas 3D tipo blobs gelatinosos que se deforman al ritmo', 'abstract 3D blobs, gelatinous shapes, changing size and color synced to each beat, gooey', 55),
  ('formas-dulces', 'ALL', 'Candy Typography', 'candy-typography', 'Letras como dulces brillantes con textura de caramelo', 'candy 3D typography, rounded shiny letters, caramel texture, entry and exit animation on beat, pastel gradient background', 60),

  -- 4) Edits al Beat
  ('edits-beat', 'ALL', 'Beat-Synced Photo Montage', 'beat-montage', 'Muchas fotos entrando justo en cada golpe de la canción', 'vertical photo montage, one photo per beat, fast flash transitions, perfectly synced to music', 75),
  ('edits-beat', 'ALL', 'Cinematic Beat Reel', 'beat-reel', 'Mezcla de fotos y texto con cortes precisos, sensación de tráiler', 'cinematic trailer style reel, quick zooms, cuts on beat, short uppercase text, warm color grading', 70),
  ('edits-beat', 'ALL', 'Slideshow Festival', 'slideshow-festival', 'Fotos apiladas como carrusel con movimientos de cámara suaves y zoom en beats fuertes', 'photo slideshow with camera movement, zoom on every drop, concert light textures, smooth transitions', 65),

  -- 5) Promo Comercial
  ('promo', 'ALL', 'Social Ad LATAM', 'social-ad-latam', 'Directo, grandes precios, CTA claro, estética de anuncio de retail latino', 'vertical promo ad latin american style, large prices, bold typography, red and yellow colors, fast energetic animation', 75),
  ('promo', 'ALL', 'Colorful Promo Blocks', 'promo-blocks', 'Bloques de color que cambian con el ritmo, cada bloque una frase de venta', 'colorful blocks, each block with a short phrase, changes synced to beat, modern promo style', 65),
  ('promo', 'ALL', 'Sticker & Emoji Overload', 'emoji-overload', 'Muchos stickers, emojis grandes y texto mínimo, muy TikTok', 'tiktok style video, giant emojis, animated stickers, short text, fast transitions on beat, playful', 60),

  -- 6) Latino Virales
  ('latino-virales', 'ALL', 'Latin Party Reel', 'latin-party-reel', 'Luces, neones, tipografía grande, mucho movimiento al ritmo latino', 'latin party reel style, neon lights, large typography, high energy, constant movement, reggaeton vibe', 80),
  ('latino-virales', 'ALL', 'Reggaeton Promo', 'reggaeton-promo', 'Letras contundentes, colores cálidos, zooms agresivos', 'reggaeton promo style, bold letters, warm colors, aggressive zooms, urban latin aesthetic', 75),
  ('latino-virales', 'ALL', 'Urban Street Ad', 'urban-street', 'Textura de pared, grafiti, cortes duros, estética callejera', 'urban street ad, wall texture, graffiti, hard cuts, street aesthetic, edgy urban style', 65),
  ('latino-virales', 'ALL', 'Festival Aftermovie', 'festival-aftermovie', 'Cámara en movimiento, luces de concierto, flashes al beat', 'festival aftermovie style, moving camera, concert lights, flash effects on beat, crowd energy, epic', 70)
) AS v(cat_slug, id_empresa, nombre, slug, descripcion, keywords_ia, tendencia_base)
JOIN video_categorias_estilo c ON c.slug = v.cat_slug AND c.id_empresa = v.id_empresa
ON CONFLICT (slug, id_categoria, id_empresa) DO NOTHING;
