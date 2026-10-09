-- 20261008190000_sh_clients.sql
-- Perfil de clientes para login teléfono+contraseña.
-- La cuenta va en auth.users (email sintético p<digits>@phone.servicioshogar.mx);
-- sh_clients solo guarda el teléfono legible + nombre para soporte y rate-limit.
-- Altas: server.js /api/auth/register con service_role (sin policy INSERT en cliente).

CREATE TABLE IF NOT EXISTS public.sh_clients (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone        TEXT NOT NULL UNIQUE,
    display_name TEXT,
    active       BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT sh_clients_phone_e164 CHECK (phone ~ '^\+[1-9]\d{7,14}$')
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.sh_clients (phone);

ALTER TABLE public.sh_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients read own" ON public.sh_clients;
CREATE POLICY "Clients read own"
    ON public.sh_clients FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Clients update own" ON public.sh_clients;
CREATE POLICY "Clients update own"
    ON public.sh_clients FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
