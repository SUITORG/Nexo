# CHECKLIST DE LANZAMIENTO — [NOMBRE PROYECTO]

> **Para qué sirve:** verifica antes de lanzar que funcione, esté medido, respaldado y sea operable. Basado en `GuiaTotal/GUIA.md` §14.
> **Audiencia:** quien aprueba el lanzamiento (dev + responsable del proyecto).
> **Versión:** 1.0 · **Fecha:** [FECHA]

---

## Funcionalidad

- [ ] Flujo completo de punta a punta probado (móvil y escritorio)
- [ ] Datos inválidos, duplicados y spam probados
- [ ] Fallos de servicios externos probados (timeout, error de API)

## Seguridad

- [ ] HTTPS activo y redirección HTTP → HTTPS
- [ ] Secretos solo en variables de entorno (nada en código/frontend)
- [ ] Roles y permisos verificados **en backend**, no solo ocultos en UI
- [ ] `id_empresa` en toda query si es multiempresa
- [ ] Validación de entrada en backend (esquema)
- [ ] Rate limiting / antispam en endpoints públicos

## Medición

- [ ] Conversión/evento principal medido (analytics)
- [ ] Errores de producción monitoreados con alerta

## Respaldo

- [ ] Backup de datos + configuración activo
- [ ] Restauración **probada** al menos una vez

## Documentación

- [ ] `MANUAL_CLIENTE.md` actualizado
- [ ] `MANUAL_PROVEEDOR.md` actualizado
- [ ] `MANUAL_TECNICO.md` actualizado
- [ ] `MANUAL_PRUEBAS.md` actualizado
- [ ] `CONTRATO.md` al día con lo que se lanzó
- [ ] `IDENTIDAD_CORPORATIVA.md` revisado (si aplica)

## Legal (si recolecta datos personales)

- [ ] Política de privacidad publicada
- [ ] Términos y condiciones publicados

---

**Aprobado:** [nombre] · **Fecha:** [FECHA] · **Commit:** [sha]
