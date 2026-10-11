# Plantilla Landing + Leads — reuso RUCP (extraída de SuitContractRenew)

Plantilla oscura (navy/teal) con form de leads → Supabase. Usar en todo módulo Suit* que venda a clientes.

## Tokens (reemplazar `{{TOKEN}}` al copiar a `Suit<Nombre>/landing/index.html`)

| Token | Ejemplo (ContractRenew) |
|---|---|
| `{{NOMBRE}}` | ContractRenew |
| `{{META_DESC}}` | Registro de contratos... (≤160 chars) |
| `{{ACCENT}}` | `#2dd4bf` |
| `{{SLOGAN}}` | Nunca más se te pase una renovación |
| `{{OFERTA}}` | Aviso 60 días antes de cada vencimiento |
| `{{DESCRIPCION}}` | bloque "Para ti si:" (HTML permitido) |
| `{{CTA_HERO}}` | Pásame la lista de contratos |
| `{{PROB1_T}}/{{PROB1_P}}` … `PROB3` | 3 tarjetas de problema |
| `{{PASO1_T}}/{{PASO1_P}}` … `PASO3` | 3 pasos "cómo funciona" |
| `{{PLAN1_NOMBRE}}/{{PLAN1_PRECIO}}` + `LI1/LI2/LI3` | Taller $29... |
| `{{PLAN2_...}}` | plan destacado |
| `{{FAQ1_Q}}/{{FAQ1_A}}` … `FAQ4` | objeciones → respuestas |
| `{{LEAD_H1}}` | titular del form |
| `{{FORM_CAMPOS}}` | campos extra del form (HTML select/input) o vacío |
| `{{FOOTER}}` | texto del footer (puerto + disclaimer) |

Contenido de cada token = **segmentos 6,7,11,12,17,18,19,20 del BRIEF_CLIENTE.md** — no inventar copy fuera del brief.

## Pasos al instalar en un módulo

1. Copiar `index.template.html` → `Suit<Nombre>/landing/index.html`, reemplazar tokens.
2. `hero.png`: generar con Flow (`node <clone>/generate-asset.cjs "<prompt>" landing/assets/hero.png` — dark flat vector, sin texto, tono del brief).
3. Crear tabla Supabase (Management API o SQL):
```sql
create table public.leads_<slug> (
  id bigint generated always as identity primary key,
  nombre text not null, negocio text, whatsapp text, email text,
  mensaje text, creado timestamptz default now()
);
alter table public.leads_<slug> enable row level security;
```
4. Pegar `handler-leads.snippet.js` en `index.js` del módulo (antes del `express.static`), ajustar tabla `leads_<slug>` y campos.
5. `.env` del módulo: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (nunca commitear).
6. Smoke: landing 200 → POST lead 201 → fila visible → borrar fila de prueba.
7. `robots: noindex,nnofollow` se queda **mientras sea demo interna**; quitar solo si se decide indexar (regla EvaSol).
