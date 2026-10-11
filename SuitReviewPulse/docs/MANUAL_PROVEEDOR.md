# MANUAL PROVEEDOR — ReviewPulse

> **Para qué sirve:** cómo entregar ReviewPulse como servicio a un negocio.
> **Audiencia:** proveedor / equipo comercial SuitOrg.
> **Última actualización:** 2026-10-10

## Alcance del servicio
- Activar cuenta, cargar reseñas (CSV exportado o Places API con Place ID).
- Configurar frecuencia de revisión y a quién se le avisa.
- Capacitar 15 min al cliente (ver MANUAL_CLIENTE.md).

## Fuera de alcance (cobrar aparte / no ofrecer)
- Contestar reseñas por el cliente (solo borradores).
- Gestión de reputación multi-plataforma (Facebook, Yelp) — futuro.
- Campañas de pedir reseñas (futuro).

## Operación recurrente
1. Verificar que el sync/CSV sigue corriendo (semanal).
2. Revisar alertas de rating < 4.0 y escalar al dueño.
3. Reporte mensual de resumen si el plan lo incluye (Pro).

## Pricing de reventa
Pases $19 / $39 / $49 (ver MANUAL_VENTAS.md). Margen: costo variable ~0 (Python local + Places free tier $200/mo).
