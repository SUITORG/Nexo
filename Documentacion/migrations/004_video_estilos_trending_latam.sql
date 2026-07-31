-- 004_video_estilos_trending_latam.sql
-- 6 categorías / 19 sub-estilos adicionales (lista provista por el usuario:
-- Tipografía y Letras, Avatar y Personajes, Formas Dulces, Edits al Beat,
-- Promo Comercial, Latino Virales). keywords_ia redactadas para inyección en
-- prompt de imagen IA a partir de los nombres — el usuario no las tenía.
-- Aplicado directo vía Supabase MCP el 2026-07-31; este archivo es la copia
-- documental (mismo patrón que 003_video_estilos.sql: JOIN por slug, no ID
-- hardcodeado).

INSERT INTO video_categorias_estilo (id_empresa, nombre, slug, descripcion, icono) VALUES
  ('ALL', 'Tipografía y Letras', 'tipografia_letras', 'Estilos centrados en texto animado, lettering y tipografía como elemento visual principal', '🔤'),
  ('ALL', 'Avatar y Personajes', 'avatar_personajes', 'Estilos de personajes/avatares ilustrados como protagonistas visuales', '🧑‍🎨'),
  ('ALL', 'Formas Dulces', 'formas_dulces', 'Estética 3D tipo candy/gummy, formas suaves y coloridas', '🍬'),
  ('ALL', 'Edits al Beat', 'edits_beat', 'Montajes y transiciones sincronizadas al ritmo musical', '🎵'),
  ('ALL', 'Promo Comercial', 'promo_comercial', 'Estilos de anuncio/venta directa para redes sociales', '📢'),
  ('ALL', 'Latino Virales', 'latino_virales', 'Estética urbana/festiva latinoamericana de alto engagement', '🔥')
ON CONFLICT (slug, id_empresa) DO NOTHING;

INSERT INTO video_subestilos (id_categoria, id_empresa, nombre, slug, descripcion, keywords_ia, tendencia_base)
SELECT c.id, v.id_empresa, v.nombre, v.slug, v.descripcion, v.keywords_ia, v.tendencia_base
FROM (VALUES
  ('tipografia_letras', 'ALL', 'Bold Kinetic Typography', 'bold_kinetic_typography', 'Texto animado en movimiento, tipografía audaz y dinámica', 'bold kinetic typography, animated text motion, dynamic word reveal, high contrast lettering, tiktok style captions', 60),
  ('tipografia_letras', 'ALL', 'Lyrics / Karaoke Viral', 'lyrics_karaoke_viral', 'Letras estilo karaoke sincronizadas, formato viral musical', 'karaoke lyric video style, bouncing text sync, colorful highlighted words, music video captions, viral lyric overlay', 65),
  ('tipografia_letras', 'ALL', 'Cartel Urbano Latino', 'cartel_urbano_latino', 'Tipografía tipo cartel/graffiti urbano latino', 'urban latino poster style, graffiti typography, street art lettering, bold neon colors, reggaeton flyer aesthetic', 55),

  ('avatar_personajes', 'ALL', 'Avatar Cartoon Pop', 'avatar_cartoon_pop', 'Avatar estilo caricatura pop, colores planos vibrantes', 'cartoon avatar, pop art character design, bold outlines, flat vibrant colors, playful mascot style', 55),
  ('avatar_personajes', 'ALL', 'Avatar 3D Pixar', 'avatar_3d_pixar', 'Avatar 3D estilo animación tipo Pixar', '3d pixar style character, soft rounded shapes, warm cinematic lighting, expressive big eyes, animated movie render', 60),
  ('avatar_personajes', 'ALL', 'Avatar Sticker Reels', 'avatar_sticker_reels', 'Avatar tipo sticker con borde blanco, estética de Reels', 'sticker style avatar, die-cut white border, glossy cartoon character, instagram sticker pack aesthetic', 50),

  ('formas_dulces', 'ALL', 'Gummy 3D / Candy 3D', 'gummy_candy_3d', 'Render 3D tipo gomita/dulce, texturas glossy', 'gummy candy 3d render, glossy translucent texture, jelly bounce physics, saturated candy colors, soft studio lighting', 55),
  ('formas_dulces', 'ALL', 'Blob Dance', 'blob_dance', 'Personajes blob animados bailando, formas redondeadas', 'blob character animation, squishy morphing shapes, bouncy dance motion, minimalist rounded forms, playful bright colors', 50),
  ('formas_dulces', 'ALL', 'Candy Typography', 'candy_typography', 'Tipografía 3D estilo dulce/gomita', 'candy-coated 3d typography, glossy jelly letters, pastel and neon color mix, sweet dessert aesthetic', 45),

  ('edits_beat', 'ALL', 'Beat-Synced Photo Montage', 'beat_synced_montage', 'Montaje de fotos sincronizado al ritmo, cortes rápidos', 'beat-synced photo transitions, rhythmic quick cuts, punchy zoom flashes, music video montage energy', 60),
  ('edits_beat', 'ALL', 'Cinematic Beat Reel', 'cinematic_beat_reel', 'Edición cinematográfica sincronizada al beat', 'cinematic beat-driven editing, dramatic slow motion mixed with fast cuts, moody color grading, trailer-style pacing', 60),
  ('edits_beat', 'ALL', 'Slideshow Festival', 'slideshow_festival', 'Slideshow de fotos estilo festival, tonos cálidos', 'festival photo slideshow, warm golden hour tones, crowd energy, confetti and light flares, celebratory montage', 50),

  ('promo_comercial', 'ALL', 'Social Ad LATAM', 'social_ad_latam', 'Anuncio social estilo LATAM, colores tropicales vibrantes', 'latin american social media ad style, vibrant tropical colors, bold call-to-action graphics, mobile-first composition', 55),
  ('promo_comercial', 'ALL', 'Colorful Promo Blocks', 'colorful_promo_blocks', 'Bloques geométricos coloridos de promoción/oferta', 'colorful geometric promo blocks, flat design shapes, bold price offer callouts, modern e-commerce ad style', 50),
  ('promo_comercial', 'ALL', 'Sticker & Emoji Overload', 'sticker_emoji_overload', 'Collage de stickers y emojis, estilo maximalista', 'sticker and emoji collage, playful overlay graphics, meme style decoration, maximalist social media aesthetic', 50),

  ('latino_virales', 'ALL', 'Latin Party Reel', 'latin_party_reel', 'Ambiente de fiesta latina, luces neón, energía nocturna', 'latin party atmosphere, neon club lighting, dynamic crowd dancing, vibrant nightlife energy, festive colors', 60),
  ('latino_virales', 'ALL', 'Reggaeton Promo', 'reggaeton_promo', 'Estética urbana reggaetón, streetwear neón', 'reggaeton urban aesthetic, neon streetwear style, bold graffiti accents, nightlife promo energy', 60),
  ('latino_virales', 'ALL', 'Urban Street Ad', 'urban_street_ad', 'Anuncio urbano callejero, fondo de ciudad, graffiti', 'urban street advertising style, city backdrop, graffiti walls, bold streetwear branding, gritty realistic lighting', 50),
  ('latino_virales', 'ALL', 'Festival Aftermovie', 'festival_aftermovie', 'Estilo cinematográfico de aftermovie de festival', 'festival aftermovie cinematic style, sweeping drone shots, crowd euphoria, colorful stage lights, high energy montage', 55)
) AS v(cat_slug, id_empresa, nombre, slug, descripcion, keywords_ia, tendencia_base)
JOIN video_categorias_estilo c ON c.slug = v.cat_slug AND c.id_empresa = v.id_empresa
ON CONFLICT (slug, id_categoria, id_empresa) DO NOTHING;
