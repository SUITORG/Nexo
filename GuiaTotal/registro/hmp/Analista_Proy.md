# Analista_Proy — HMP · Hamburguesas Metroplex

> Investigado: 2026-09-27 | Fuentes: 2 búsquedas web (4+ fuentes regionales) | **Corrida enfocada** (no 4 pilares completos — negocio local sin huella web; suficiente para giro/copy/identidad)
> Etapa: idea → registro semiautomatico (`empresa-registro`) · Alcance: raíz SuitOrg (proyecto SuitOrg)

## Resumen ejecutivo

HMP (Hamburguesas Metroplex) es una hamburguesería local del área metropolitana de Monterrey (tel +52 81) registrada en `Config_Empresas` con `habilitado: true` y **sin presencia web propia** (búsqueda exacta "Hamburguesas Metroplex" = 0 resultados directos). El mercado hamburguesa de MTY está activo y segmentado (clásicas históricas, smash, premium/artesanales, presupuesto bajo $50-200 MXN) con competidores fuertes locales. Riesgo #1: invisibilidad digital (sin listing en agregadores) — la plataforma SuitOrg es precisamente su canal.

## Clasificación sugerida (match exacto a `GuiaTotal/TAXONOMIA.md`)

- **Industria:** Alimentos y Hospitalidad (id 7)
- **Nicho:** Restaurantes y Comida Rápida (`restaurantes`)
- **Especialización:** Comida Rápida
- **Hipótesis vs hallazgo:** se mantuvo (`tipo_negocio: Alimentos` existente → validado contra catálogo)

## Pilar — Mercado (evidencia regional)

- **Segmento clásico con historia**: Hamburguesas del Río (c. Constitución), Teo Burger (desde 1982, $55+), El Chino (4.5★, 287 reseñas) — *México Desconocido (2026-02-25)*, grubbio.com.
- **Segmento smash en auge**: The Smashed Ones (Distrito Tec), Mr. Smashie — precio $180 MXN aprox. del premium smash.
- **Segmento familiar/ premium**: Holy Cow! (Fashion Drive), Muncher House (3,200+ reseñas).
- **Presupuesto bajo**: Bambinos House 5.0★, Junior Bacon — pedidos por WhatsApp, entrega <15 min (patrón: canal WhatsApp = el mismo que HMP ya tiene en `telefonowhatsapp`).
- **Señal**: los de bajo presupuesto compiten con velocidad + WhatsApp, no con web. HMP ya tiene WhatsApp habilitado → su ventaja inmediata es el canal, no un sitio.

## Evidencia desconfirmatoria

- **0 huella web de HMP** — no hay reseñas, menú online ni ubicación publicada → no se pudo verificar antigüedad, sucursales ni calidad real; todo copy debe evitar afirmaciones no verificables (regla del prompt de identidad).
- Competencia con marca propia y trayectoria → entrar por diferenciación de precio/servicio, no por "el mejor de la ciudad" (claim no demostrable).

## Decisión

- **Viabilidad de registro:** alta — la estructura/copy/identidad se crean sin afirmaciones inventadas.
- **Siguiente paso:** copy (slogan/mensajes) + identidad → llenado de `Config_Empresas` → sync Supabase.
- **Pendiente real:** listing en directorios (Google Business) — fuera del alcance de esta skill, anotar en PENDIENTES del proyecto.

## Fotoagente

- Foto seleccionada (Unsplash, licencia libre): hamburguesa clásica — `photo-1568901346375-23c9450c58cd`.
- Subida como `fotoagente.jpg` a la **raíz** de `cteHMP/` (share ANYONE) → `https://drive.google.com/file/d/19UxpM3SNNzO9oOdo0-nFBf3iTIm6_S5W/view?usp=drivesdk`
