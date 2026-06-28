# Decisiones Técnicas — SuitOrg

## Arquitectura

| Decisión | Por qué | Descartado |
|---|---|---|
| **Vanilla JS sin frameworks** | Simplicidad, sin dependencias, despliegue directo a GH Pages | React/Vue/Svelte (overhead innecesario para SPA pequeña) |
| **GAS + Sheets como DB primaria** | Cero costo de servidor, edición directa en Excel, despliegue simple | Base de datos tradicional (costo, complejidad operativa) |
| **Supabase como migración** | Escalabilidad, PostgreSQL nativo, RLS, tiempo real | Firebase (vendor lock-in, costos impredecibles) |
| **Híbrido GSheets ↔ Supabase** | Migración gradual sin downtime, 5 tablas maestras siempre editables en Sheets | Migración directa (riesgo de pérdida de datos) |
| **Dual backend: GAS + Node** | GAS para lógica core (bajo costo), Node para AI/Stripe/Supabase (necesario) | Solo GAS (no soporta Supabase/Stripe), solo Node (costos servidor) |
| **IDs secuenciales `PREFIX-NNN`** | Legibles para humanos, depuración más fácil, soporte en Google Sheets | UUIDs (ilegibles, malos para Sheets, difíciles de recordar) |
| **Soft-delete con `activo`** | Auditoría histórica, recuperación sencilla, consistencia Sheets | DELETE físico (pérdida de datos irrecuperable) |
| **Token estático para GAS** | Simple, sin OAuth flow, funciona con `no-cors` | JWT/OAuth (complejidad innecesaria para backend propietario) |
| **GAS `ANYONE_ANONYMOUS`** | Acceso público sin login de Google (proxy pattern intencional) | Autenticación Google (requiere login del usuario) |

## AI

| Decisión | Por qué | Descartado |
|---|---|---|
| **Gemini como AI principal** | API key gratuita, buena calidad/ precio, integración nativa GAS | OpenAI (costo, sin integración GAS directa) |
| **OpenRouter como fallback** | Multi-modelo sin vendor lock-in, modelos gratuitos disponibles | Proveedor único (riesgo caída/ cambios de precio) |
| **Multi-model fallback loop** | Resiliencia: si un modelo falla, prueba el siguiente sin intervención | Modelo único (caída = sistema caído) |
| **Prompts en base de datos (parcial)** | Editar comportamiento sin desplegar código | Prompts hardcodeados (actual en script.js:449-486, a migrar) |

## Frontend

| Decisión | Por qué | Descartado |
|---|---|---|
| **Hash routing (`#orbit`)** | Funciona sin servidor, soporte nativo, ideal para GH Pages | History API (requiere servidor configurado) |
| **Módulos en `js/modules/`** | Separación de responsabilidades, fácil localización | SPA monolítica (difícil de mantener) |
| **Toast notifications** | Feedback visual no intrusivo para el usuario | Alert/confirm nativos (feos, bloqueantes) |

## Infraestructura

| Decisión | Por qué | Descartado |
|---|---|---|
| **WSL 2 como entorno dev** | Rendimiento Unix nativo en Windows, ripgrep/fd para búsquedas rápidas | PowerShell/CMD (lento para búsquedas, sin grep) |
| **FFmpeg vía `execSync`** | Sin dependencias npm, control total de parámetros | fluent-ffmpeg (dependencia adicional) |
| **Base64 para media** | Simple, sin servidor de archivos, funciona en GAS | File upload a CDN (costo adicional, complejidad) |
| **Stripe multi-tenant por env var** | `STRIPE_SECRET_KEY_{companyId}` aísla pagos por cliente | Stripe Connect (mucho más complejo) |

[PENDIENTE: No hay documentación de por qué se eligió `service_role` key en Supabase en vez de RLS + anon key. Parece una deuda técnica de la migración inicial.]
