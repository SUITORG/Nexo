-- ============================================================
-- Migración 006: Sistema de Referidos y Cupones
-- ============================================================

-- Tabla de referidos (código único por usuario)
CREATE TABLE IF NOT EXISTS sh_referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  referrer_type TEXT NOT NULL CHECK (referrer_type IN ('technician', 'client')),
  referrer_id TEXT NOT NULL,
  referred_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_mxn NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON sh_referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON sh_referrals(referrer_id, referrer_type);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON sh_referrals(referred_id);

-- Tabla de cupones de descuento
CREATE TABLE IF NOT EXISTS sh_coupons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  discount_mxn NUMERIC(10,2) NOT NULL,
  discount_percent NUMERIC(5,2),
  referrer_type TEXT CHECK (referrer_type IN ('technician', 'client')),
  referrer_id TEXT,
  used_by TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  min_order_mxn NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON sh_coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_used_by ON sh_coupons(used_by);

-- RLS: referrals
ALTER TABLE sh_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrals: referrer reads own"
  ON sh_referrals FOR SELECT
  USING (auth.uid()::text = referrer_id);

CREATE POLICY "Referrals: referrer reads by code"
  ON sh_referrals FOR SELECT
  USING (true);

CREATE POLICY "Referrals: insert"
  ON sh_referrals FOR INSERT
  WITH CHECK (auth.uid()::text = referrer_id);

CREATE POLICY "Referrals: update own"
  ON sh_referrals FOR UPDATE
  USING (auth.uid()::text = referrer_id OR auth.uid()::text = referred_id);

-- RLS: coupons
ALTER TABLE sh_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons: anyone reads active"
  ON sh_coupons FOR SELECT
  USING (status = 'active');

CREATE POLICY "Coupons: system manages"
  ON sh_coupons FOR ALL
  USING (true)
  WITH CHECK (true);

-- Función: generar código único de 8 caracteres alfanuméricos
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Función: aplicar cupón a una orden (reduce el total)
CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_code TEXT,
  p_order_id TEXT,
  p_user_id TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC(10,2) := 0;
BEGIN
  SELECT * INTO v_coupon
  FROM sh_coupons
  WHERE code = p_coupon_code
    AND status = 'active'
    AND (v_coupon.expires_at IS NULL OR v_coupon.expires_at > now())
    AND current_uses < max_uses
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cupón inválido o expirado';
  END IF;

  v_discount := LEAST(v_coupon.discount_mxn, 500);

  UPDATE sh_coupons
  SET status = 'used',
      used_by = p_user_id,
      used_at = now(),
      current_uses = current_uses + 1
  WHERE id = v_coupon.id;

  RETURN v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
