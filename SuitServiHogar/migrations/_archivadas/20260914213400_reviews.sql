-- ═══════════════════════════════════════════════════
-- FASE 3.1: sh_reviews (calificación bidireccional)
-- ═══════════════════════════════════════════════════

-- 1. Tabla sh_reviews
CREATE TABLE IF NOT EXISTS public.sh_reviews (
    id              TEXT PRIMARY KEY,
    order_id        TEXT NOT NULL REFERENCES public.sh_orders(id) ON DELETE CASCADE,
    reviewer_id     TEXT NOT NULL,
    reviewee_id     TEXT NOT NULL,
    reviewer_role   TEXT NOT NULL CHECK (reviewer_role IN ('client', 'technician')),
    rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sh_reviews ENABLE ROW LEVEL SECURITY;

-- 2. RLS
CREATE POLICY "Reviews read for participants"
    ON public.sh_reviews FOR SELECT
    USING (true);

CREATE POLICY "Reviews insert for authenticated"
    ON public.sh_reviews FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role full access reviews"
    ON public.sh_reviews FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_reviews_order ON public.sh_reviews (order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.sh_reviews (reviewee_id, rating);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_per_order ON public.sh_reviews (order_id, reviewer_role);
