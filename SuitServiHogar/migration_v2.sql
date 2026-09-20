-- ============================================================
-- SUITESERVIHOGAR - Migración v2: Cancelaciones, Donaciones, Penalizaciones
-- Extiende schema.sql existente
-- ============================================================

-- ─────────────────────────────────────────────
-- EXTENSIONES sh_orders: nuevos campos
-- ─────────────────────────────────────────────
ALTER TABLE public.sh_orders
  ADD COLUMN IF NOT EXISTS roundup_donation_mxn INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('CLIENT', 'SPECIALIST', 'SYSTEM')),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_fee_mxn INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS specialist_penalty_mxn INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_coupon_id UUID,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────
-- NUEVA TABLA: platform_earnings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_earnings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id          TEXT REFERENCES public.sh_orders(id),
    amount_mxn          INTEGER NOT NULL,           -- comisión plataforma en centavos
    charity_fee_mxn     INTEGER NOT NULL DEFAULT 0, -- 1% de amount_mxn
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read platform_earnings" ON public.platform_earnings;
CREATE POLICY "Admin read platform_earnings"
    ON public.platform_earnings FOR SELECT USING (
        EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'level' >= '10')
    );

DROP POLICY IF EXISTS "Insert platform_earnings" ON public.platform_earnings;
CREATE POLICY "Insert platform_earnings"
    ON public.platform_earnings FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- NUEVA TABLA: charity_ledger
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.charity_ledger (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month            DATE NOT NULL UNIQUE,      -- primer día del mes
    platform_charity_mxn    INTEGER NOT NULL DEFAULT 0, -- suma charity_fee_mxn
    client_roundup_mxn      INTEGER NOT NULL DEFAULT 0, -- suma roundup_donation_mxn
    total_donated_mxn       INTEGER NOT NULL DEFAULT 0, -- platform_charity + client_roundup
    beneficiary_entity      TEXT NOT NULL DEFAULT 'Fundación Hogar Digno AC',
    status                  TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'AUDITED')),
    audit_report_json       JSONB,
    processed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.charity_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read charity_ledger" ON public.charity_ledger;
CREATE POLICY "Public read charity_ledger"
    ON public.charity_ledger FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write charity_ledger" ON public.charity_ledger;
CREATE POLICY "Admin write charity_ledger"
    ON public.charity_ledger FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'level' >= '10')
    );

-- ─────────────────────────────────────────────
-- NUEVA TABLA: specialist_penalties
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.specialist_penalties (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialist_id       TEXT REFERENCES public.sh_technicians(id),
    booking_id          TEXT REFERENCES public.sh_orders(id),
    penalty_type        TEXT NOT NULL CHECK (penalty_type IN ('LATE_CANCELLATION', 'NO_SHOW')),
    amount_mxn          INTEGER NOT NULL,
    stars_deduction     NUMERIC(3,1) DEFAULT 0,
    stripe_transfer_id  TEXT,
    applied_at          TIMESTAMPTZ DEFAULT NOW(),
    expires_at          TIMESTAMPTZ
);

ALTER TABLE public.specialist_penalties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Specialist read own penalties" ON public.specialist_penalties;
CREATE POLICY "Specialist read own penalties"
    ON public.specialist_penalties FOR SELECT USING (
        specialist_id = auth.uid()::text
    );

DROP POLICY IF EXISTS "Admin all penalties" ON public.specialist_penalties;
CREATE POLICY "Admin all penalties"
    ON public.specialist_penalties FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'level' >= '10')
    );

-- ─────────────────────────────────────────────
-- NUEVA TABLA: client_coupons
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       TEXT,
    booking_id      TEXT REFERENCES public.sh_orders(id),
    amount_mxn      INTEGER NOT NULL,
    code            TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'USED', 'EXPIRED')),
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client read own coupons" ON public.client_coupons;
CREATE POLICY "Client read own coupons"
    ON public.client_coupons FOR SELECT USING (client_id = auth.uid()::text);

DROP POLICY IF EXISTS "Admin all coupons" ON public.client_coupons;
CREATE POLICY "Admin all coupons"
    ON public.client_coupons FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'level' >= '10')
    );

-- ─────────────────────────────────────────────
-- NUEVA TABLA: cancellation_policies
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        TEXT NOT NULL,
    free_cancellation_hours     INTEGER NOT NULL DEFAULT 24,
    late_cancellation_fee_mxn   INTEGER NOT NULL DEFAULT 12000,
    specialist_penalty_mxn      INTEGER NOT NULL DEFAULT 15000,
    stars_deduction             NUMERIC(3,1) NOT NULL DEFAULT 0.2,
    client_coupon_mxn           INTEGER NOT NULL DEFAULT 10000,
    is_active                   BOOLEAN DEFAULT TRUE,
    created_at                  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active policies" ON public.cancellation_policies;
CREATE POLICY "Public read active policies"
    ON public.cancellation_policies FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin write policies" ON public.cancellation_policies;
CREATE POLICY "Admin write policies"
    ON public.cancellation_policies FOR ALL USING (
        EXISTS (SELECT 1 FROM auth.users u WHERE u.id = auth.uid() AND u.raw_user_meta_data->>'level' >= '10')
    );

-- Seed política por defecto
INSERT INTO public.cancellation_policies (name, free_cancellation_hours, late_cancellation_fee_mxn, specialist_penalty_mxn, stars_deduction, client_coupon_mxn)
VALUES ('default_2026', 24, 12000, 15000, 0.2, 10000)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_technician_status ON public.sh_orders (technician_id, status);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_month ON public.platform_earnings (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_charity_ledger_month ON public.charity_ledger (period_month);
CREATE INDEX IF NOT EXISTS idx_specialist_penalties_spec ON public.specialist_penalties (specialist_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_client_coupons_client ON public.client_coupons (client_id, status);

-- ─────────────────────────────────────────────
-- FUNCIONES Y TRIGGERS
-- ─────────────────────────────────────────────

-- Función: calcular fee caridad (1% de comisión)
CREATE OR REPLACE FUNCTION public.calculate_charity_fee(platform_amount_mxn INTEGER)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT (platform_amount_mxn * 1 / 100)::INTEGER;
$$;

-- Trigger: actualizar charity_fee_mxn en platform_earnings
CREATE OR REPLACE FUNCTION public.update_charity_fee()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.charity_fee_mxn := public.calculate_charity_fee(NEW.amount_mxn);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_earnings_charity ON public.platform_earnings;
CREATE TRIGGER trg_platform_earnings_charity
  BEFORE INSERT OR UPDATE ON public.platform_earnings
  FOR EACH ROW EXECUTE FUNCTION public.update_charity_fee();

-- Trigger: updated_at en sh_orders
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sh_orders_updated_at ON public.sh_orders;
CREATE TRIGGER trg_sh_orders_updated_at
  BEFORE UPDATE ON public.sh_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────
-- FUNCIÓN: Cancelación por Cliente
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_client_cancellation(
  p_booking_id TEXT,
  p_client_id TEXT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_booking RECORD;
  v_policy RECORD;
  v_hours_before NUMERIC;
  v_fee_mxn INTEGER := 0;
  v_specialist_payout INTEGER := 0;
  v_platform_retain INTEGER := 0;
  v_result JSONB;
BEGIN
  SELECT * INTO v_booking FROM public.sh_orders WHERE id = p_booking_id;
  SELECT * INTO v_policy FROM public.cancellation_policies WHERE is_active = TRUE LIMIT 1;

  IF v_booking.client_id != p_client_id THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF v_booking.status IN ('COMPLETED', 'CANCELLED', 'released') THEN
    RAISE EXCEPTION 'Orden no cancelable';
  END IF;

  v_hours_before := EXTRACT(EPOCH FROM (v_booking.created_at + INTERVAL '24 hours' - NOW())) / 3600;
  -- Usar scheduled_at si existe como timestamp, sino created_at + 24h
  IF v_booking.date IS NOT NULL THEN
    -- date es TEXT tipo "Mañana, 15 Mar" - no parseable fácilmente
    -- Fallback: usar created_at + 24h
  END IF;

  -- Gratis si >24h ANTES o status = draft/pending
  IF v_hours_before > v_policy.free_cancellation_hours OR v_booking.status IN ('draft') THEN
    v_fee_mxn := 0;
  ELSE
    v_fee_mxn := v_policy.late_cancellation_fee_mxn;      -- 12000 centavos = $120 MXN
    v_specialist_payout := 10000;                         -- $100 MXN al técnico
    v_platform_retain := 2000;                            -- $20 MXN plataforma
  END IF;

  UPDATE public.sh_orders SET
    status = 'CANCELLED',
    cancelled_by = 'CLIENT',
    cancelled_at = NOW(),
    cancellation_fee_mxn = v_fee_mxn,
    specialist_payout_mxn = v_booking.specialist_payout_mxn + v_specialist_payout,
    platform_commission_mxn = COALESCE(v_booking.platform_commission_mxn, 0) + v_platform_retain,
    updated_at = NOW()
  WHERE id = p_booking_id;

  IF v_fee_mxn > 0 THEN
    INSERT INTO public.platform_earnings (booking_id, amount_mxn, period_start, period_end)
    VALUES (p_booking_id, v_platform_retain,
      date_trunc('month', NOW())::DATE,
      (date_trunc('month', NOW()) + INTERVAL '1 month - 1 day')::DATE);
  END IF;

  v_result := jsonb_build_object(
    'success', TRUE,
    'fee_mxn', v_fee_mxn / 100.0,
    'specialist_payout_mxn', v_specialist_payout / 100.0,
    'platform_retain_mxn', v_platform_retain / 100.0,
    'message', CASE WHEN v_fee_mxn = 0 THEN 'Cancelación sin cargo' ELSE 'Cancelación tardía: $120 MXN ($100 técnico + $20 plataforma)' END
  );

  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────
-- FUNCIÓN: Cancelación por Especialista
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.process_specialist_cancellation(
  p_booking_id TEXT,
  p_specialist_id TEXT
) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE
  v_booking RECORD;
  v_policy RECORD;
  v_hours_before NUMERIC;
  v_penalty_mxn INTEGER := 0;
  v_coupon_code TEXT;
  v_coupon_id UUID;
BEGIN
  SELECT * INTO v_booking FROM public.sh_orders WHERE id = p_booking_id;
  SELECT * INTO v_policy FROM public.cancellation_policies WHERE is_active = TRUE LIMIT 1;

  IF v_booking.technician_id != p_specialist_id THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF v_booking.status NOT IN ('funded', 'in_progress') THEN
    RAISE EXCEPTION 'Solo se penaliza cancelación de órdenes aceptadas (funded/in_progress)';
  END IF;

  -- Calcular horas antes usando created_at como proxy
  v_hours_before := EXTRACT(EPOCH FROM (v_booking.created_at + INTERVAL '24 hours' - NOW())) / 3600;

  IF v_hours_before < 2 THEN
    v_penalty_mxn := v_policy.specialist_penalty_mxn;      -- 15000 = $150 MXN
    v_coupon_code := 'COMP' || UPPER(SUBSTRING(ENCODE(GEN_RANDOM_BYTES(4), 'hex') FROM 1 FOR 8));

    INSERT INTO public.specialist_penalties (specialist_id, booking_id, penalty_type, amount_mxn, stars_deduction, expires_at)
    VALUES (p_specialist_id, p_booking_id, 'LATE_CANCELLATION', v_penalty_mxn, v_policy.stars_deduction, NOW() + INTERVAL '30 days');

    INSERT INTO public.client_coupons (client_id, booking_id, amount_mxn, code, expires_at)
    VALUES (v_booking.client_id, p_booking_id, v_policy.client_coupon_mxn, v_coupon_code, NOW() + INTERVAL '90 days')
    RETURNING id INTO v_coupon_id;

    UPDATE public.sh_orders SET
      status = 'CANCELLED',
      cancelled_by = 'SPECIALIST',
      cancelled_at = NOW(),
      specialist_penalty_mxn = v_penalty_mxn,
      client_coupon_id = v_coupon_id,
      updated_at = NOW()
    WHERE id = p_booking_id;

    RETURN jsonb_build_object(
      'success', TRUE,
      'penalty_mxn', v_penalty_mxn / 100.0,
      'stars_deduction', v_policy.stars_deduction,
      'client_coupon', jsonb_build_object('code', v_coupon_code, 'amount_mxn', v_policy.client_coupon_mxn / 100.0),
      'message', 'Penalización por cancelación <2h antes de la cita'
    );
  ELSE
    UPDATE public.sh_orders SET
      status = 'CANCELLED',
      cancelled_by = 'SPECIALIST',
      cancelled_at = NOW(),
      updated_at = NOW()
    WHERE id = p_booking_id;

    RETURN jsonb_build_object('success', TRUE, 'penalty_mxn', 0, 'message', 'Cancelación sin penalización (>2h)');
  END IF;
END;
$$;

-- ─────────────────────────────────────────────
-- FUNCIÓN: Acumulación mensual caridad
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accumulate_monthly_charity(p_month DATE DEFAULT date_trunc('month', NOW())::DATE)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_platform_charity INTEGER := 0;
  v_client_roundup INTEGER := 0;
  v_total INTEGER := 0;
  v_audit JSONB;
BEGIN
  SELECT COALESCE(SUM(charity_fee_mxn), 0) INTO v_platform_charity
  FROM public.platform_earnings
  WHERE period_start >= p_month
    AND period_end < p_month + INTERVAL '1 month';

  SELECT COALESCE(SUM(roundup_donation_mxn), 0) INTO v_client_roundup
  FROM public.sh_orders
  WHERE status IN ('completed', 'released')
    AND created_at >= p_month
    AND created_at < p_month + INTERVAL '1 month';

  v_total := v_platform_charity + v_client_roundup;

  v_audit := jsonb_build_object(
    'period_month', p_month,
    'platform_charity_mxn', v_platform_charity,
    'client_roundup_mxn', v_client_roundup,
    'total_mxn', v_total,
    'platform_earnings_count', (SELECT COUNT(*) FROM public.platform_earnings WHERE period_start >= p_month AND period_end < p_month + INTERVAL '1 month'),
    'bookings_with_donation_count', (SELECT COUNT(*) FROM public.sh_orders WHERE status IN ('completed', 'released') AND roundup_donation_mxn > 0 AND created_at >= p_month AND created_at < p_month + INTERVAL '1 month'),
    'generated_at', NOW()
  );

  INSERT INTO public.charity_ledger (period_month, platform_charity_mxn, client_roundup_mxn, total_donated_mxn, audit_report_json, status)
  VALUES (p_month, v_platform_charity, v_client_roundup, v_total, v_audit, 'PENDING')
  ON CONFLICT (period_month) DO UPDATE SET
    platform_charity_mxn = EXCLUDED.platform_charity_mxn,
    client_roundup_mxn = EXCLUDED.client_roundup_mxn,
    total_donated_mxn = EXCLUDED.total_donated_mxn,
    audit_report_json = EXCLUDED.audit_report_json,
    status = 'PENDING';
END;
$$;

-- ─────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- ─────────────────────────────────────────────
SELECT 'sh_orders (extendida)' AS tabla, COUNT(*) AS total FROM public.sh_orders
UNION ALL
SELECT 'platform_earnings', COUNT(*) FROM public.platform_earnings
UNION ALL
SELECT 'charity_ledger', COUNT(*) FROM public.charity_ledger
UNION ALL
SELECT 'specialist_penalties', COUNT(*) FROM public.specialist_penalties
UNION ALL
SELECT 'client_coupons', COUNT(*) FROM public.client_coupons
UNION ALL
SELECT 'cancellation_policies', COUNT(*) FROM public.cancellation_policies
UNION ALL
SELECT 'sh_service_categories', COUNT(*) FROM public.sh_service_categories
UNION ALL
SELECT 'sh_technicians', COUNT(*) FROM public.sh_technicians;