# Migrar CampanasAi a Supabase (Opción 3)

**Objetivo**: Supabase como fuente única de verdad. GAS queda como respaldo/sincronización.

---

## Fase 1 — Habilitar Supabase MCP y crear tablas

1. Habilitar MCP: quitar `"supabase"` de `disabledMcpjsonServers` en `CampanasAi/.claude/settings.local.json`
2. Usar Supabase MCP para crear tablas:

### Tabla: `industrias`
```sql
create table industrias (
  id bigint generated always as identity primary key,
  categoria text not null unique,
  icono text not null,
  descripcion text not null,
  activo boolean default true,
  created_at timestamptz default now()
);
```

### Tabla: `nichos`
```sql
create table nichos (
  id bigint generated always as identity primary key,
  industria_id bigint not null references industrias(id) on delete cascade,
  valor text not null,
  etiqueta text not null,
  sinonimos jsonb default '[]',
  especializaciones jsonb default '[]',
  activo boolean default true,
  created_at timestamptz default now(),
  unique(industria_id, valor)
);
```

### Tabla: `campanas`
```sql
create table campanas (
  id text primary key,
  empresa text not null,
  nombre text not null,
  tema text not null,
  formato text not null,
  fecha_creacion date default current_date,
  estado text default 'generando',
  configuracion jsonb default '{}',
  created_at timestamptz default now()
);
```

### Tabla: `config_empresas`
```sql
create table config_empresas (
  id bigint generated always as identity primary key,
  empresa text not null unique,
  config jsonb default '{}',
  activo boolean default true,
  created_at timestamptz default now()
);
```

---

## Fase 2 — Instalar Supabase JS en CampanasAi

```bash
cd CampanasAi
npm install @supabase/supabase-js
```

Crear `CampanasAi/lib/supabase.js`:
```js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // service_role para backend

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
```

---

## Fase 3 — Endpoints en local-server-node.js

Agregar rutas en el server (`local-server-node.js`):

### `/api/industrias` (GET)
- Reemplaza el `fetch` al JSON estático
- Hace `supabase.from('industrias').select('*, nichos(*)')` ordenado por categoria
- Responde JSON igual al formato de `industrias.json` para no romper frontend

### `/api/industrias` (POST)
- Inserta nueva industria + nichos

### `/api/industrias/:id` (PUT)
- Actualiza industria o nichos existentes

### `/api/campanas` (GET)
- Reemplaza proxy a GAS history
- Hace `supabase.from('campanas').select('*').order('created_at', { ascending: false }).limit(20)`

### `/api/campanas` (POST)
- Guarda campaña en Supabase (reemplaza POST a GAS)

### `/api/config` (GET)
- Reemplaza proxy a GAS config
- Hace `supabase.from('config_empresas').select('*')`

### `/api/config` (POST)
- Guarda/actualiza config empresa

---

## Fase 4 — Seed (migrar datos existentes)

Crear `CampanasAi/scripts/seed-supabase.js`:

1. Lee `config/industrias.json` e inserta cada categoria + nichos en Supabase
2. Lee `database/campañas.json` e inserta campañas
3. Lee `database/plantillas.json` (si aplica)

Ejecutar:
```bash
node scripts/seed-supabase.js
```

---

## Fase 5 — Frontend: apuntar a Supabase

En `script.js`:

1. Reemplazar:
   ```js
   fetch('/config/industrias.json')
   ```
   Por:
   ```js
   fetch('/api/industrias')
   ```

2. Mantener misma estructura de respuesta para no cambiar lógica de `initCategoriaLookup()`

3. Opcional: agregar sección "Admin Industrias" en el frontend para CRUD vía POST/PUT a `/api/industrias`

---

## Fase 6 — GAS como respaldo

1. En `backend.gs`, agregar endpoint que recibe datos desde Supabase y los respalda en Sheets
2. O crear script Node.js `scripts/sync-gas.js` que cada cierto tiempo: lee Supabase → escribe en GAS
3. GAS sigue funcionando independientemente si Supabase falla

---

## Archivos modificados/resumidos

| Archivo | Acción |
|---------|--------|
| `CampanasAi/.claude/settings.local.json` | Habilitar Supabase MCP |
| `CampanasAi/package.json` | Agregar `@supabase/supabase-js` |
| `CampanasAi/lib/supabase.js` | **CREAR** — cliente Supabase |
| `CampanasAi/local-server-node.js` | Agregar endpoints Supabase |
| `CampanasAi/scripts/seed-supabase.js` | **CREAR** — migración inicial |
| `CampanasAi/script.js` | Cambiar fetch industrias → API |
| `CampanasAi/backend.gs` | Endpoint respaldo desde Supabase |
