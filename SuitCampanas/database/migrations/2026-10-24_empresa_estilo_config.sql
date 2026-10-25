-- Configuración de estilo visual por empresa.
-- modo = 'auto'   -> el sistema elige el estilo con el criterio de los expertos
--        'manual' -> el usuario elige un id_subestilo del catálogo
create table if not exists public.empresa_estilo_config (
    id_empresa text primary key,
    modo text not null default 'auto' check (modo in ('auto', 'manual')),
    id_subestilo integer null,
    actualizado_en timestamptz not null default now()
);

alter table public.empresa_estilo_config enable row level security;

-- Sembrar las empresas existentes en modo automático (idempotente).
insert into public.empresa_estilo_config (id_empresa, modo)
select distinct id_empresa, 'auto'
from public."Config_Empresas"
where id_empresa is not null and id_empresa <> ''
on conflict (id_empresa) do nothing;

comment on table public.empresa_estilo_config is
'Switch de estilo visual por empresa: auto (expertos) o manual (id_subestilo elegido por el usuario).';
