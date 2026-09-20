-- 008_admin_role.sql
-- Agregar campo role a sh_technicians para distinguir admin vs técnico

ALTER TABLE sh_technicians ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'technician';

-- Seed: el usuario con email rojo@suitorg.com es admin
UPDATE sh_technicians SET role = 'admin' WHERE email ILIKE '%rojo%suitorg%';

-- Función helper: ¿es admin? (por email)
CREATE OR REPLACE FUNCTION is_admin_by_email(uemail TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM sh_technicians t
    WHERE t.email ILIKE uemail AND t.role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
