-- ============================================================
-- APLICAR EN SUPABASE SQL EDITOR (una sola corrida, idempotente)
-- Fuente: migraciones locales nunca aplicadas + nuevos fixes
--   1) sh_config (falta de prod: rompe AdminScreen "Configuración"
--      y la lectura de comisiones en server.js)
--   2) sh_price_negotiations (rompe PriceNegotiation en Chat/Booking)
--   3) Seeds de config + flag de impuestos show_tax_info
--   4) Admin: rbtpdrn@gmail.com (ya creado vía API, se refuerza aquí)
-- Nota: las políticas admin de sh_config se corrigen (la original
--   referenciaba sh_technicians.user_id que NO existe → abortaba).
-- ============================================================

-- ─── 1) sh_config ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sh_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.sh_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_admin_read" ON sh_config;
DROP POLICY IF EXISTS "config_admin_write" ON sh_config;
DROP POLICY IF EXISTS "config_public_read" ON sh_config;

-- Lectura pública (el frontend anónimo lee flags como show_tax_info)
CREATE POLICY "config_public_read" ON sh_config FOR SELECT USING (true);

-- Escritura solo admin (por email → is_admin_by_email, ya existente)
CREATE POLICY "config_admin_write" ON sh_config FOR ALL
  USING (public.is_admin_by_email(auth.jwt() ->> 'email'))
  WITH CHECK (public.is_admin_by_email(auth.jwt() ->> 'email'));

-- Seeds (migración 20260916000000_antifuga_config.sql)
INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'antifuga_whatsapp',
  '{
    "enabled": true,
    "detection_patterns": ["whatsapp\\.com","wa\\.me","\\+\\d{1,3}[\\s-]?\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}","agregame al?\\s*whatsapp","pásame a whatsapp","mejor hablemos por whatsapp"],
    "warning_message": "Mantén la conversación aquí para tu protección y garantía Escrow",
    "enable_gamification": true,
    "xp_per_message": 1, "xp_per_photo": 5, "xp_per_evidence": 10,
    "level_thresholds": [0, 50, 150, 400, 1000, 2500],
    "streak_rewards_enabled": true, "chat_timer_enabled": true, "chat_timer_hours": 2,
    "detection_enabled": true
  }'::jsonb,
  'Configuración anti-fuga WhatsApp: patrones de detección, gamificación, recompensas',
  'antifuga'
),
(
  'off_app_payments',
  '{
    "enabled": true, "detection_enabled": true,
    "detection_patterns": ["pago en efectivo","pago en efectivo fuera","paguemos en efectivo","efectivo fuera de la app","transferencia directa","pago directo","efectivo sin app","pago fuera de la plataforma"],
    "detection_message": "Los pagos fuera de la app pierden protección Escrow y garantía. ¿Seguro que deseas continuar?",
    "auto_commission_rate_pct": 15,
    "report_reward_client_mxn": 100,
    "technician_trust_threshold_warning": 50,
    "technician_trust_threshold_suspension": 30,
    "minimum_trust_for_matching": 40
  }'::jsonb,
  'Configuración para detección y manejo de pagos fuera de la app',
  'off_app_payments'
),
(
  'platform_commission',
  '{"standard_pct": 15, "volume_discount_pct": 10, "volume_min_orders": 20, "volume_min_rating": 4.7, "min_amount_mxn": 10, "max_coupon_discount_pct": 50, "min_payment_after_coupon_mxn": 10}'::jsonb,
  'Configuración de comisiones de la plataforma',
  'platform'
),
(
  'referral_rewards',
  '{"technician_reward_mxn": 15000, "client_reward_mxn": 10000, "code_prefix_technician": "REF-TECH-", "code_prefix_client": "REF-CLIENT-", "code_length": 8}'::jsonb,
  'Configuración de recompensas por referidos',
  'referrals'
),
(
  'gamification',
  '{"enabled": true, "xp_per_message": 1, "xp_per_photo": 5, "xp_per_evidence": 10, "level_thresholds": [0, 50, 150, 400, 1000, 2500], "streak_rewards_enabled": true, "streak_days_required": 1}'::jsonb,
  'Configuración de gamificación y niveles de confianza',
  'gamification'
)
ON CONFLICT (key) DO NOTHING;

-- Migración 20260916110000_decisions_config.sql
INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'charity_fee_pct',
  '1'::jsonb,
  'Porcentaje de comisión destinado a caridad (Fundación Hogar Digno AC)',
  'decisions'
)
ON CONFLICT (key) DO NOTHING;

-- ─── 3) Flag de impuestos (nuevo) ────────────────────────────
-- false = oculto en pantallas de cliente (default); true = visible
INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'show_tax_info',
  'false'::jsonb,
  'Mostrar info fiscal (SAT/ISR/IVA/CFDI) en pantallas de cliente. Editable desde Admin → Configuración',
  'decisions'
)
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_sh_config_category ON sh_config(category);
CREATE INDEX IF NOT EXISTS idx_sh_config_updated_at ON sh_config(updated_at DESC);

-- ─── 2) sh_price_negotiations ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sh_price_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES sh_orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_price_mxn INTEGER NOT NULL,
  client_offer_mxn INTEGER,
  technician_offer_mxn INTEGER,
  agreed_price_mxn INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'client_offered', 'technician_countered', 'accepted', 'rejected', 'expired')),
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('client', 'technician')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sh_price_negotiations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "negotiation_participants_read" ON sh_price_negotiations;
DROP POLICY IF EXISTS "client_create_negotiation" ON sh_price_negotiations;
DROP POLICY IF EXISTS "technician_update_negotiation" ON sh_price_negotiations;
DROP POLICY IF EXISTS "client_update_negotiation" ON sh_price_negotiations;
DROP POLICY IF EXISTS "service_role_all" ON sh_price_negotiations;

CREATE POLICY "negotiation_participants_read"
  ON sh_price_negotiations FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = technician_id);

CREATE POLICY "client_create_negotiation"
  ON sh_price_negotiations FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "technician_update_negotiation"
  ON sh_price_negotiations FOR UPDATE
  USING (auth.uid() = technician_id);

CREATE POLICY "client_update_negotiation"
  ON sh_price_negotiations FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "service_role_all"
  ON sh_price_negotiations FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_sh_price_negotiations_order ON sh_price_negotiations(order_id);
CREATE INDEX IF NOT EXISTS idx_sh_price_negotiations_status ON sh_price_negotiations(status);
CREATE INDEX IF NOT EXISTS idx_sh_price_negotiations_expires ON sh_price_negotiations(expires_at);

-- ─── 4) Admin ────────────────────────────────────────────────
-- Fila admin (idempotente) + semilla de la migración admin_role.sql
INSERT INTO public.sh_technicians (id, name, email, role, active, availability_badge, category_ids)
VALUES ('admin-rbtpdrn', 'Administrador', 'rbtpdrn@gmail.com', 'admin', true, 'No disponible', ARRAY[]::text[])
ON CONFLICT (id) DO UPDATE SET role = 'admin', active = true;

UPDATE public.sh_technicians SET role = 'admin', active = true
WHERE email ILIKE 'rbtpdrn@gmail.com';

UPDATE public.sh_technicians SET role = 'admin'
WHERE email ILIKE '%rojo%suitorg%';

-- Verificación
SELECT email, role, active FROM sh_technicians WHERE role = 'admin';
SELECT key, value, category FROM sh_config WHERE key IN ('show_tax_info', 'platform_commission', 'charity_fee_pct');
