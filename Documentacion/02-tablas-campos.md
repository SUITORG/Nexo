# SuitOrg — Tablas y Campos Clave

## Regla general
Los encabezados en GSheets NO están estandarizados — pueden tener mayúsculas, minúsculas o espacios. El código usa funciones como `getField()` para buscar el campo sin importar el formato exacto.

---

## Config_Empresas — El cerebro del sistema
Esta tabla decide TODO. Vive en GSheets y también en Supabase.

| Campo | Valores posibles | Descripción |
|---|---|---|
| `id_empresa` | PFM, HMP, SUITORG... | Identificador único del negocio |
| `nomempresa` | texto | Nombre del negocio |
| `db_engine` | GSHEETS, SUPABASE | De dónde lee los datos |
| `habilitado` | TRUE, FALSE, vacío | Si el negocio está activo |
| `modo` | PROD, HIDDEN | PROD=visible en Hub, HIDDEN=oculto |
| `modo_sitio` | HYBRID, NOHYBRIDO, vacío | Si es tenant independiente (en pruebas) |
| `es_principal` | TRUE, FALSE | Si es el tenant principal |
| `origen_politicas` | ROL, USUARIO | De dónde saca los permisos |
| `modo_creditos` | DIARIO, GLOBAL, USUARIO | Cómo se calculan los créditos |
| `color_tema` | #hex | Color principal del negocio |

**Importante:** Cuando `db_engine = SUPABASE`, el GAS lee las tablas desde Supabase en lugar de GSheets.

---

## Config_Roles — Permisos por rol y empresa
Los roles NO son globales — el mismo nombre (CAJERO) puede tener permisos diferentes en cada empresa.

| Campo | Valores posibles | Descripción |
|---|---|---|
| `id_empresa` | PFM, HMP... | A qué empresa pertenece |
| `id_rol` | CAJERO, STAFF, DIOS... | Nombre del rol |
| `nivel_acceso` | 1-999 | Nivel numérico de acceso |
| `modulos_visibles` | dashboard,pos,leads... | Lista separada por comas |
| `creditos` | número | Créditos asignados al rol |
| `vigencia_dias` | número | Días de vigencia del acceso |

---

## Usuarios — Quién puede entrar
Un mismo `id_usuario` puede existir en múltiples empresas. El filtro es por `id_empresa` al momento del login.

| Campo | Descripción |
|---|---|
| `id_empresa` | A qué empresa pertenece este usuario |
| `id_usuario` | Identificador del usuario |
| `email` / `username` | Para el login |
| `password` | Texto plano (pendiente encriptar) |
| `rol` | Rol asignado (se cruza con Config_Roles) |
| `nivel_acceso` | Nivel numérico |
| `activo` | TRUE/FALSE |
| `fecha_limite_acceso` | Fecha de expiración |

---

## Catalogo — Productos del negocio
| Campo | Descripción |
|---|---|
| `id_empresa` | A qué negocio pertenece |
| `id_producto` | Identificador del producto |
| `nombre` | Nombre del producto |
| `categoria` | Categoría |
| `precio` | Precio normal |
| `precio_oferta` | Precio de oferta |
| `activo` | TRUE/FALSE — si se muestra en el menú |
| `imagen_url` | URL de la imagen |

**Problema conocido:** En Supabase el campo `activo` llega como string `"true"` (minúsculas), no como booleano. El filtro debe usar `String(p.activo).toUpperCase() === "TRUE"`.

---

## Tablas GLOBAL (siempre desde GSheets)
Estas tablas son el cerebro y nunca migran a Supabase como fuente primaria:
- `Config_Empresas`
- `Config_Paginas`
- `Config_SEO`
- `Config_Auth`
- `Config_Dashboard`

## Tablas PRIVATE (pueden migrar a Supabase por tenant)
- `Catalogo`
- `Usuarios`
- `Config_Roles`
- `Leads`
- `Proyectos`
- `Reservaciones`
