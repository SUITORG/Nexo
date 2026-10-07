-- 20260915160000_price_negotiation.sql
-- Sistema de negociación de precios entre cliente y técnico

CREATE TABLE IF NOT EXISTS public.sh_price_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES sh_orders(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_price_mxn INTEGER NOT NULL,      -- Precio original en centavos
  client_offer_mxn INTEGER,                  -- Oferta del cliente (centavos)
  technician_offer_mxn INTEGER,              -- Contraoferta del técnico (centavos)
  agreed_price_mxn INTEGER,                  -- Precio acordado final (centavos)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'client_offered', 'technician_countered', 'accepted', 'rejected', 'expired')),
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('client', 'technician')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sh_price_negotiations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_sh_price_negotiations_order ON sh_price_negotiations(order_id);
CREATE INDEX IF NOT EXISTS idx_sh_price_negotiations_status ON sh_price_negotiations(status);
CREATE INDEX IF NOT EXISTS idx_sh_price_negotiations_expires ON sh_price_negotiations(expires_at);

-- Función para limpiar negociaciones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_negotiations()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE sh_price_negotiations
  SET status = 'expired'
  WHERE status IN ('pending', 'client_offered', 'technician_countered')
    AND expires_at < now();
  RETURN NULL;
END $$;

-- Verificar cambios
SELECT * FROM sh_price_negotiations LIMIT 5;