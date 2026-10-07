# Runbook — Rollback

> Última revisión: 2026-10-07 · Cadena de reversión por capas. **No existe backend en producción aún** (laptop), así que los pasos 2-3 aplican cuando se despliegue.

## 1. Frontend (GitHub Pages)

```bash
# identificar el último commit bueno
git log --oneline -10

# revert del commit problemático + push (CI redespliega solo)
git revert <sha-bueno..sha-malo>   # o: git revert <sha-malo>
git push origin main
```

El CI vuelve a correr lint+tests+e2e y redespliega `dist/` anterior. Si el revert rompe los tests, primero `git checkout <sha-bueno> -- <archivo>` y commit manual.

## 2. Backend (cuando exista host)

```bash
# en el host: volver al último release bueno y reiniciar
git checkout <sha-bueno> -- server.js server/  # o tag de release
# reiniciar el servicio (systemd/docker/pm2 — definir al crear el host)
```

Verificar: `curl https://<host>/api/config/category/platform` → `{"success":true}`.

En laptop: `Ctrl+C` en `npx tsx server.js`, `git checkout <sha>`, relanzar.

## 3. Base de datos (Supabase)

**No hay migraciones "down"** — las migraciones son forward-only. Opciones, en orden:

1. **Migración de reversión**: crear un nuevo `.sql` en `supabase/migrations/` que deshaga el cambio (nunca editar/borrar una migración ya aplicada).
2. **Point-in-time Recovery**: Supabase → Database → Backups → restaurar a un punto anterior (plan con PITR).
3. **Datos puntuales**: `UPDATE` correctivo (soft delete: `active = false`, nunca `DELETE`).

⚠️ Las migraciones de `supabase/migrations/` son idempotentes — re-correrlas es seguro.

## 4. Configuración de negocio (`sh_config`)

Los parámetros (comisión %, cupones, referidos) se editan **sin deploy**: Admin → Configuración (`server.js` cachea 5 min). Para volver a defaults: borrar la fila o restaurar el JSON default documentado en `AGENTS.md` (§ Configuración desde Backoffice).

## Post-rollback

- [ ] Healthcheck 200
- [ ] Flujo test card completo
- [ ] Anotar causa en `docs/15-riesgos…` o `.suit/memory/bugs/`
- [ ] Commit del fix (no reutilizar el SHA roto)
