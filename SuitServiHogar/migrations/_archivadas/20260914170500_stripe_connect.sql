-- ============================================================
-- MIGRATION: Stripe Connect + Evidence Photos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Proyecto: egyxgnlnzanxpqyuvmsg.supabase.co
-- ============================================================

-- ─── 1. Add email + stripe_account_id to sh_technicians ───
ALTER TABLE public.sh_technicians
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- Update seed technicians with email
UPDATE public.sh_technicians SET email = 'roberto@servihogar.mx' WHERE id = 'roberto-garza';
UPDATE public.sh_technicians SET email = 'carlos@servihogar.mx' WHERE id = 'carlos-mendoza';
UPDATE public.sh_technicians SET email = 'hector@servihogar.mx' WHERE id = 'hector-villarreal';
UPDATE public.sh_technicians SET email = 'juan@servihogar.mx' WHERE id = 'juan-carlos-mendez';

-- ─── 2. Create Storage bucket for evidence photos ───
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('sh-evidence', 'sh-evidence', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── 3. RLS policies for sh-evidence bucket ───
-- Anyone can read (public bucket)
DROP POLICY IF EXISTS "Public read sh-evidence" ON storage.objects;
CREATE POLICY "Public read sh-evidence"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sh-evidence');

-- Authenticated users can upload
DROP POLICY IF EXISTS "Auth upload sh-evidence" ON storage.objects;
CREATE POLICY "Auth upload sh-evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'sh-evidence' AND auth.role() = 'authenticated');

-- ─── 4. Index for faster lookups ───
CREATE INDEX IF NOT EXISTS idx_sh_technicians_email ON public.sh_technicians (email);
CREATE INDEX IF NOT EXISTS idx_sh_orders_client_id ON public.sh_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_sh_orders_technician_id ON public.sh_orders (technician_id);
