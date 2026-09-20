-- ============================================================
-- SUITESERVIHOGAR - Schema para Supabase
-- Proyecto: egyxgnlnzanxpqyuvmsg.supabase.co
-- Prefix: sh_ (para no colisionar con tablas existentes)
-- ============================================================

-- ─────────────────────────────────────────────
-- TABLA 1: sh_service_categories
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sh_service_categories (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    icon            TEXT DEFAULT 'handyman',
    base_price_mxn  NUMERIC DEFAULT 0,
    subtitle        TEXT,
    description     TEXT,
    count           INTEGER DEFAULT 0,
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sh_service_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON public.sh_service_categories;
CREATE POLICY "Public read categories"
    ON public.sh_service_categories FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- TABLA 2: sh_technicians
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sh_technicians (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    avatar              TEXT,
    title               TEXT,
    rating              NUMERIC DEFAULT 5.0,
    review_count        INTEGER DEFAULT 0,
    distance            TEXT DEFAULT '1.2km',
    colonia             TEXT,
    verified_badges     TEXT[] DEFAULT ARRAY['INE + Biometría'],
    tags                TEXT[] DEFAULT ARRAY[]::text[],
    price_mxn           NUMERIC DEFAULT 0,
    price_usd           NUMERIC DEFAULT 0,
    price_description   TEXT,
    availability_badge  TEXT DEFAULT 'Disponible',
    years_experience    INTEGER,
    level               INTEGER DEFAULT 1,
    bio                 TEXT,
    certifications      TEXT[] DEFAULT ARRAY[]::text[],
    category_ids        TEXT[] DEFAULT ARRAY[]::text[],
    email               TEXT,
    stripe_account_id   TEXT,
    active              BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sh_technicians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read technicians" ON public.sh_technicians;
CREATE POLICY "Public read technicians"
    ON public.sh_technicians FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- TABLA 3: sh_orders
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sh_orders (
    id                  TEXT PRIMARY KEY,
    client_id           TEXT,
    technician_id       TEXT REFERENCES public.sh_technicians(id),
    service_title       TEXT,
    service_description TEXT,
    date                TEXT,
    time_window         TEXT,
    base_price_mxn      NUMERIC DEFAULT 0,
    base_price_usd      NUMERIC DEFAULT 0,
    guarantee_price_mxn NUMERIC DEFAULT 0,
    sat_retention_mxn   NUMERIC DEFAULT 0,
    total_mxn           NUMERIC DEFAULT 0,
    total_usd           NUMERIC DEFAULT 0,
    exchange_rate       NUMERIC DEFAULT 18.0,
    status              TEXT DEFAULT 'draft',
    evidence_photos     TEXT[] DEFAULT ARRAY[]::text[],
    zone_name           TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sh_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read orders" ON public.sh_orders;
CREATE POLICY "Public read orders"
    ON public.sh_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert orders" ON public.sh_orders;
CREATE POLICY "Insert orders"
    ON public.sh_orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update orders" ON public.sh_orders;
CREATE POLICY "Update orders"
    ON public.sh_orders FOR UPDATE USING (true);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tech_colonia ON public.sh_technicians (colonia);
CREATE INDEX IF NOT EXISTS idx_tech_categories ON public.sh_technicians USING GIN (category_ids);
CREATE INDEX IF NOT EXISTS idx_orders_client ON public.sh_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.sh_orders (status);

-- ─────────────────────────────────────────────
-- SEED: Categorías de Servicio
-- ─────────────────────────────────────────────
INSERT INTO public.sh_service_categories (id, name, icon, base_price_mxn, subtitle, description, count)
VALUES
    ('climas', 'Climas y HVAC', 'mode_fan', 450, 'Mantenimiento y gas', 'Servicio técnico especializado para minisplits convencionales e inverter, recargas de refrigerante R410A y mantenimientos químicos.', 18),
    ('plomeria', 'Plomería Express', 'plumbing', 380, 'Fugas, tinacos e hidros', 'Atención a fugas de agua no visibles, instalación de presurizadores, bombas sumergibles y termofusión con Tuboplus.', 14),
    ('electricidad', 'Electricidad 220V/110V', 'bolt', 400, 'Cortos y centros de carga', 'Balanceo de fases 220V para equipos de climatización, reemplazo de pastillas térmicas y tierra física industrial y residencial.', 12),
    ('cerrajeria', 'Cerrajería de Alta Seguridad', 'key', 500, 'Aperturas y chapas reforzadas', 'Apertura de cerraduras de alta seguridad, cerrojos de doble paso y duplicados de llaves de seguridad en sitio.', 9),
    ('electro', 'Línea Blanca', 'kitchen', 350, 'Refrigeración y electro', 'Reparación de refrigeradores, lavadoras, secadoras y otros electrodomésticos del hogar.', 7),
    ('herreria', 'Herrería & Portones', 'fence', 600, 'Portones y estructuras', 'Soldadura de portones, rejas, estructuras metálicas y reparaciones de herrería residencial e industrial.', 5),
    ('pintores', 'Pintores', 'format_paint', 350, 'Interiores y exteriores', 'Pintura residencial y comercial, preparación de superficies, impermeabilización de fachadas y acabados decorativos.', 15),
    ('albaniles', 'Albañiles', 'construction', 500, 'Obra civil y acabados', 'Construcción de muros, repello, pisos, azoteas, ampliaciones y acabados de concreto para residencias y maquiladoras.', 12),
    ('yeseros', 'Yeseros', 'wall_art', 400, 'Drywall y plafones', 'Instalación y reparación de tablaroca, plafones de yeso, cielos falsos y acabados de grano fino para interiores.', 8),
    ('impermeabilizante', 'Impermeabilizante', 'water_drop', 450, 'Techos y azoteas', 'Aplicación de impermeabilizantes en techos, azoteas, tanques de agua y muros con daño por humedad o filtraciones.', 6),
    ('jardineria', 'Jardinería', 'yard', 300, 'Poda y mantenimiento', 'Poda de árboles, jardines, instalación de riego, fertilización y mantenimiento de áreas verdes residenciales.', 10),
    ('escombro', 'Recoger Escombro', 'delete_sweep', 600, 'Limpieza y acarreo', 'Retiro de escombro, materiales de construcción, desechos voluminosos y limpieza general de predios y terrenos.', 4),
    ('carpinteria', 'Carpintería', 'table_chart', 450, 'Muebles y estructuras', 'Fabricación y reparación de muebles, puertas, ventanas, cocinas integrales y estructuras de madera a medida.', 8)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- SEED: Técnicos de ejemplo
-- ─────────────────────────────────────────────
INSERT INTO public.sh_technicians (id, name, avatar, title, rating, review_count, distance, colonia, tags, price_mxn, price_usd, price_description, availability_badge, years_experience, bio, category_ids, email)
VALUES
    ('roberto-garza', 'Ing. Roberto Garza', 'https://i.pravatar.cc/150?u=roberto-garza', 'Maestro en Climatización Industrial', 4.9, 127, '1.2km', 'Las Fuentes', ARRAY['Minisplit Inverter', 'Gas R410A', 'Carga de Gas'], 850, 47.22, 'Servicio completo con garantía de 30 días', 'Disponible Hoy', 12, 'Ingeniero mecánico especializado en sistemas de climatización para el sector maquilador y residencial de Reynosa.', ARRAY['climas'], 'roberto@servihogar.mx'),
    ('carlos-mendoza', 'Carlos Mendoza', 'https://i.pravatar.cc/150?u=carlos-mendoza', 'Técnico Certificado en Plomería', 4.8, 89, '2.1km', 'Jarachina Norte', ARRAY['Fugas de Agua', 'Tinacos', 'Presurizadores'], 650, 36.11, 'Fijo por visita + material', 'Disponible Mañana', 8, 'Plomero certificado con experiencia en sistemas hidráulicos residenciales y comerciales.', ARRAY['plomeria'], 'carlos@servihogar.mx'),
    ('hector-villarreal', 'Héctor Villarreal', 'https://i.pravatar.cc/150?u=hector-villarreal', 'Electricista Industrial', 4.7, 65, '3.5km', 'Petrolera', ARRAY['Cortos Eléctricos', 'Tableros 220V', 'Tierra Física'], 750, 41.67, 'Diagnóstico incluido', 'Disponible', 15, 'Electricista especializado en sistemas trifásicos para maquiladoras y residencias.', ARRAY['electricidad'], 'hector@servihogar.mx'),
    ('juan-carlos-mendez', 'Juan Carlos Méndez', 'https://i.pravatar.cc/150?u=juan-carlos', 'Especialista en HVAC Residencial', 4.95, 203, '0.8km', 'Las Fuentes', ARRAY['Minisplit', 'Split', 'Multi-Split'], 950, 52.78, 'Incluye limpieza química completa', 'Disponible Hoy', 10, 'Técnico especializado en sistemas multi-split y climatización residencial de alta eficiencia.', ARRAY['climas'], 'juan@servihogar.mx')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- EXTENSIONES sh_orders: nuevos campos (v2)
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
    amount_mxn          INTEGER NOT NULL,
    charity_fee_mxn     INTEGER NOT NULL DEFAULT 0,
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
    period_month            DATE NOT NULL UNIQUE,
    platform_charity_mxn    INTEGER NOT NULL DEFAULT 0,
    client_roundup_mxn      INTEGER NOT NULL DEFAULT 0,
    total_donated_mxn       INTEGER NOT NULL DEFAULT 0,
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

  IF v_hours_before > v_policy.free_cancellation_hours OR v_booking.status IN ('draft') THEN
    v_fee_mxn := 0;
  ELSE
    v_fee_mxn := v_policy.late_cancellation_fee_mxn;
    v_specialist_payout := 10000;
    v_platform_retain := 2000;
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

  v_hours_before := EXTRACT(EPOCH FROM (v_booking.created_at + INTERVAL '24 hours' - NOW())) / 3600;

  IF v_hours_before < 2 THEN
    v_penalty_mxn := v_policy.specialist_penalty_mxn;
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
-- VERIFICACIÓN
-- ─────────────────────────────────────────────
SELECT 'sh_service_categories' AS tabla, COUNT(*) AS total FROM public.sh_service_categories
UNION ALL
SELECT 'sh_technicians', COUNT(*) FROM public.sh_technicians
UNION ALL
SELECT 'sh_orders', COUNT(*) FROM public.sh_orders
UNION ALL
SELECT 'platform_earnings', COUNT(*) FROM public.platform_earnings
UNION ALL
SELECT 'charity_ledger', COUNT(*) FROM public.charity_ledger
UNION ALL
SELECT 'specialist_penalties', COUNT(*) FROM public.specialist_penalties
UNION ALL
SELECT 'client_coupons', COUNT(*) FROM public.client_coupons
UNION ALL
SELECT 'cancellation_policies', COUNT(*) FROM public.cancellation_policies;
