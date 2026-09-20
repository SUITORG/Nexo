-- 20260916000000_antifuga_config.sql
-- Configuración para anti-fuga WhatsApp y manejo de pagos fuera de la app

CREATE TABLE IF NOT EXISTS public.sh_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.sh_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_admin_read" ON sh_config FOR SELECT USING (
  EXISTS (SELECT 1 FROM sh_technicians t WHERE t.user_id = auth.uid() AND t.role = 'admin')
);

CREATE POLICY "config_admin_write" ON sh_config FOR ALL USING (
  EXISTS (SELECT 1 FROM sh_technicians t WHERE t.user_id = auth.uid() AND t.role = 'admin')
);

CREATE POLICY "config_public_read" ON sh_config FOR SELECT USING (true);

-- Configuración por defecto para Anti-fuga WhatsApp
INSERT INTO public.sh_config (key, value, description, category) VALUES
(
  'antifuga_whatsapp',
  '{
    "enabled": true,
    "detection_patterns": [
      "whatsapp\\.com",
      "wa\\.me",
      "\\+\\d{1,3}[\\s-]?\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}",
      "agregame al?\\s*whatsapp",
      "pásame a whatsapp",
      "mejor hablemos por whatsapp"
    ],
    "warning_message": "Mantén la conversación aquí para tu protección y garantía Escrow",
    "enable_gamification": true,
    "xp_per_message": 1,
    "xp_per_photo": 5,
    "xp_per_evidence": 10,
    "level_thresholds": [0, 50, 150, 400, 1000, 2500],
    "level_rewards": {
      "1": {"type": "badge", "value": "Comunicador Novato"},
      "2": {"type": "badge", "value": "Comunicador Activo"},
      "3": {"type": "badge", "value": "Comunicador Confiable", "commission_discount_pct": 1},
      "4": {"type": "badge", "value": "Comunicador Experto", "commission_discount_pct": 2},
      "5": {"type": "badge", "value": "Comunicador Maestro", "commission_discount_pct": 3, "priority_matching": true}
    },
    "streak_rewards": {
      "7": {"type": "coupon", "value_mxn": 50, "description": "Racha de 7 días"},
      "14": {"type": "coupon", "value_mxn": 100, "description": "Racha de 14 días"},
      "30": {"type": "coupon", "value_mxn": 200, "description": "Racha de 30 días"}
    },
    "achievement_rewards": {
      "first_agreement": {"type": "coupon", "value_mxn": 50, "description": "Primer acuerdo in-app"},
      "five_agreements": {"type": "coupon", "value_mxn": 150, "description": "5 acuerdos sin fuga"},
      "ten_agreements": {"type": "coupon", "value_mxn": 300, "description": "10 acuerdos sin fuga"},
      "negotiator_expert": {"type": "badge", "value": "Negociador Experto", "commission_discount_pct": 2}
    },
    "streak_rewards_enabled": true,
    "chat_timer_enabled": true,
    "chat_timer_hours": 2,
    "detection_enabled": true
  }'::jsonb,
  'Configuración anti-fuga WhatsApp: patrones de detección, gamificación, recompensas',
  'antifuga'
),
(
  'off_app_payments',
  '{
    "enabled": true,
    "detection_enabled": true,
    "detection_patterns": [
      "pago en efectivo",
      "pago en efectivo fuera",
      "paguemos en efectivo",
      "efectivo fuera de la app",
      "transferencia directa",
      "pago directo",
      "efectivo sin app",
      "pago fuera de la plataforma"
    ],
    "detection_message": "Los pagos fuera de la app pierden protección Escrow y garantía. ¿Seguro que deseas continuar?",
    "post_service_verification_enabled": true,
    "post_service_verification_hours": 24,
    "post_service_message": "¿Se completó el servicio? ¿El pago se realizó a través de la app?",
    "auto_commission_pending_enabled": true,
    "auto_commission_rate_pct": 15,
    "crowdsourced_reporting_enabled": true,
    "report_reward_client_mxn": 100,
    "technician_trust_penalty_on_report": 15,
    "technician_trust_penalty_on_detection": 10,
    "technician_trust_bonus_on_app_payment": 5,
    "technician_trust_threshold_warning": 50,
    "technician_trust_threshold_suspension": 30,
    "technician_trust_recovery_per_app_payment": 2,
    "minimum_trust_for_matching": 40,
    "client_report_reward_mxn": 100,
    "technician_warning_message": "Se ha detectado un posible acuerdo de pago fuera de la plataforma. Recuerda que los pagos fuera de la app pierden protección Escrow."
  }'::jsonb,
  'Configuración para detección y manejo de pagos fuera de la app',
  'off_app_payments'
),
(
  'platform_commission',
  '{
    "standard_pct": 15,
    "volume_discount_pct": 10,
    "volume_min_orders": 20,
    "volume_min_rating": 4.7,
    "min_amount_mxn": 10,
    "max_coupon_discount_pct": 50,
    "min_payment_after_coupon_mxn": 10
  }'::jsonb,
  'Configuración de comisiones de la plataforma',
  'platform'
),
(
  'referral_rewards',
  '{
    "technician_reward_mxn": 15000,
    "client_reward_mxn": 10000,
    "code_prefix_technician": "REF-TECH-",
    "code_prefix_client": "REF-CLIENT-",
    "code_length": 8
  }'::jsonb,
  'Configuración de recompensas por referidos',
  'referrals'
),
(
  'gamification',
  '{
    "enabled": true,
    "xp_per_message": 1,
    "xp_per_photo": 5,
    "xp_per_evidence": 10,
    "level_thresholds": [0, 50, 150, 400, 1000, 2500],
    "level_rewards": {
      "1": {"type": "badge", "value": "Comunicador Novato"},
      "2": {"type": "badge", "value": "Comunicador Activo"},
      "3": {"type": "badge", "value": "Comunicador Confiable", "commission_discount_pct": 1},
      "4": {"type": "badge", "value": "Comunicador Experto", "commission_discount_pct": 2},
      "5": {"type": "badge", "value": "Comunicador Maestro", "commission_discount_pct": 3, "priority_matching": true}
    },
    "streak_rewards": {
      "7": {"type": "coupon", "value_mxn": 50, "description": "Racha de 7 días"},
      "14": {"type": "coupon", "value_mxn": 100, "description": "Racha de 14 días"},
      "30": {"type": "coupon", "value_mxn": 200, "description": "Racha de 30 días"}
    },
    "achievement_rewards": {
      "first_agreement": {"type": "coupon", "value_mxn": 50, "description": "Primer acuerdo in-app"},
      "five_agreements": {"type": "coupon", "value_mxn": 150, "description": "5 acuerdos sin fuga"},
      "ten_agreements": {"type": "coupon", "value_mxn": 300, "description": "10 acuerdos sin fuga"},
      "negotiator_expert": {"type": "badge", "value": "Negociador Experto", "commission_discount_pct": 2}
    },
    "streak_rewards_enabled": true,
    "streak_days_required": 1
  }'::jsonb,
  'Configuración de gamificación y niveles de confianza',
  'gamification'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sh_config_category ON sh_config(category);
CREATE INDEX IF NOT EXISTS idx_sh_config_updated_at ON sh_config(updated_at DESC);