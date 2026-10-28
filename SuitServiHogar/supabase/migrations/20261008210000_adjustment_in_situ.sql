-- 20261008210000_adjustment_in_situ.sql
-- Req #44 — Re-cotización / Ajuste de presupuesto in-situ
-- Change Order 2026-10-08: Opción A — extiende sh_price_negotiations (req #41)
-- en vez de columnas nuevas en sh_orders (fuente única de precio = total_mxn).
-- Idempotente: seguro contra la base remota ya actualizada.

ALTER TABLE public.sh_price_negotiations
  ADD COLUMN IF NOT EXISTS phase TEXT NOT NULL DEFAULT 'PRE_PAYMENT'
    CHECK (phase IN ('PRE_PAYMENT', 'IN_SITU')),
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS extra_amount_mxn INTEGER,            -- centavos
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;       -- 2do PI del ajuste

-- Seguridad (ruta de dinero): el cliente NO puede marcar 'accepted' un ajuste
-- in-situ directo desde el cliente — saltaría el cobro. Solo service_role
-- (endpoints de server.js tras verificar el PaymentIntent) hace esa transición.
CREATE OR REPLACE FUNCTION protect_in_situ_accept()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.phase = 'IN_SITU'
     AND NEW.status = 'accepted'
     AND OLD.status IS DISTINCT FROM 'accepted'
     AND coalesce(auth.role()::text, '') <> 'service_role' THEN
    RAISE EXCEPTION 'Ajuste in-situ: solo el servidor confirma tras el cobro';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_in_situ_accept ON public.sh_price_negotiations;
CREATE TRIGGER trg_protect_in_situ_accept
  BEFORE UPDATE ON public.sh_price_negotiations
  FOR EACH ROW EXECUTE FUNCTION protect_in_situ_accept();

-- Notas:
-- - Sin políticas RLS nuevas: el server escribe con service_role (bypass RLS)
--   y ambas partes LEEN la fila vía "negotiation_participants_read" existente.
-- - cleanup_expired_negotiations() sigue sin trigger (deuda pre-existente, fuera de alcance #44).
