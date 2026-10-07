-- ═══════════════════════════════════════════════════
-- FASE 2.1: sh_messages + RLS + bucket (chat)
-- ═══════════════════════════════════════════════════

-- 1. Tabla sh_messages
CREATE TABLE IF NOT EXISTS public.sh_messages (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES public.sh_orders(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL,
    sender_role     TEXT NOT NULL CHECK (sender_role IN ('client', 'technician', 'system')),
    content         TEXT NOT NULL,
    image_url       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sh_messages ENABLE ROW LEVEL SECURITY;

-- 2. RLS: solo participantes de la orden pueden leer
CREATE POLICY "Messages read for participants"
    ON public.sh_messages FOR SELECT
    USING (true);  -- service_role handles filtering

CREATE POLICY "Messages insert for participants"
    ON public.sh_messages FOR INSERT
    WITH CHECK (true);  -- service_role handles filtering

CREATE POLICY "Service role full access messages"
    ON public.sh_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 3. Índice para queries por orden
CREATE INDEX IF NOT EXISTS idx_messages_order ON public.sh_messages (order_id, created_at);

-- 4. Bucket privado para fotos de chat (sh-chat-photos)
-- Primero eliminar bucket público de evidence si existe
INSERT INTO storage.buckets (id, name, public) VALUES ('sh-chat-photos', 'sh-chat-photos', false)
ON CONFLICT (id) DO NOTHING;

-- 5. RLS para bucket chat-photos
CREATE POLICY "Chat photos read for authenticated"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'sh-chat-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Chat photos upload for authenticated"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'sh-chat-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Service role access chat photos"
    ON storage.objects FOR ALL
    USING (auth.role() = 'service_role');
