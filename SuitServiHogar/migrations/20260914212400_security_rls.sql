-- Migración 003: Seguridad RLS para sh_orders
-- Requiere auth.uid() para SELECT/UPDATE en sh_orders

-- Habilitar RLS en sh_orders (si no está habilitado)
ALTER TABLE public.sh_orders ENABLE ROW LEVEL SECURITY;

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Users can view own orders" ON public.sh_orders;
DROP POLICY IF EXISTS "Technicians can view assigned orders" ON public.sh_orders;
DROP POLICY IF EXISTS "Service role full access" ON public.sh_orders;

-- Política: service_role tiene acceso completo (para backend)
CREATE POLICY "Service role full access"
    ON public.sh_orders FOR ALL
    USING (auth.role() = 'service_role');

-- Política: usuarios autenticados pueden ver órdenes donde son client_id
CREATE POLICY "Clients view own orders"
    ON public.sh_orders FOR SELECT
    USING (auth.uid()::text = client_id);

-- Política: técnicos pueden ver órdenes asignadas (vía email match)
CREATE POLICY "Technicians view assigned orders"
    ON public.sh_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sh_technicians t
            WHERE t.id = sh_orders.technician_id
            AND t.email IS NOT NULL
            AND t.email = (auth.jwt() ->> 'email')
        )
    );

-- Política: clientes pueden crear órdenes propias
CREATE POLICY "Clients insert own orders"
    ON public.sh_orders FOR INSERT
    WITH CHECK (auth.uid()::text = client_id);

-- Política: clientes pueden actualizar estado de sus órdenes (cancelación)
CREATE POLICY "Clients update own orders"
    ON public.sh_orders FOR UPDATE
    USING (auth.uid()::text = client_id);

-- Política: técnicos pueden actualizar estado de órdenes asignadas
CREATE POLICY "Technicians update assigned orders"
    ON public.sh_orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.sh_technicians t
            WHERE t.id = sh_orders.technician_id
            AND t.email IS NOT NULL
            AND t.email = (auth.jwt() ->> 'email')
        )
    );
