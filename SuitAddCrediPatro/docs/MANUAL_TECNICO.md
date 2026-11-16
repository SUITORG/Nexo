# MANUAL TÉCNICO - SuitAddCrediPatro

> **Para qué sirve este manual:** documenta la arquitectura, el catálogo de programas y cómo mantenerlo al día.
> **Audiencia:** backend — desarrollador o administrador técnico del proyecto.
> **Versión:** 1.0 · **Última actualización:** 2026-11-12 · **Stack:** HTML+JS vanilla · **Puerto(s):** ninguno (estático)

---

## Para qué sirve este manual (detalle)

Manual de mantenimiento y configuración: estructura del catálogo, lógica de scoring, actualización de programas y diagnóstico. No cubre el uso (`MANUAL_CLIENTE.md` / `MANUAL_PROVEEDOR.md`) ni solo pruebas (`MANUAL_PRUEBAS.md`).

## Resumen en corto (tabla técnica)

| Aspecto | Qué es |
|---|---|
| **Alcance** | Carpeta `SuitAddCrediPatro/` — módulo independiente (no SPA) |
| **Tipo** | Aplicación web estática local (herramienta interna) |
| **Frontend** | HTML + JS vanilla (`index.html` + `app.js`), estilo RUCP oscuro |
| **Backend** | Ninguno (sin servidor, sin APIs) |
| **Base de datos** | `localStorage['acp_perfil']` (perfil) + catálogo `CATALOGO` en `app.js` |
| **¿Google Sheets?** | no |
| **Configuración** | Ninguna — todo en el código (`CATALOGO`, `ESTADOS`, `DEST_LABEL`) |
| **Para correrlo** | MASTER.html → pestaña «Credito/Patrocinio» (o abrir `index.html` directo) |

## 1. Arquitectura general

```text
[MASTER.html iframe] → [index.html] → [app.js] → [CATALOGO (18 programas) + localStorage]
```

- `leerPerfil()` → `scorePrograma()` (puntos por cobertura/destino/monto/formalidad/antigüedad) → `diagnostico()` + `renderRecomendaciones()` (top 6) + `renderArgumentario()` (escrito pros/contras).
- Funciones de cálculo: `scorePrograma`, `diagnostico`, `prosPerfil`, `contrasPerfil`, `preguntasEntrevista`.
- Sin red: todo vive en el código (decisión ADR-063).

## 2. Stack y ejecución

- **Requisitos de equipo:** cualquier SO con navegador moderno · Node solo para validar sintaxis
- Comandos: `node --check SuitAddCrediPatro/app.js` · sin build ni dependencias · puertos: ninguno

## 3. Variables de entorno

Ninguna. **Nunca** meter secretos (el módulo no tiene red).

## 4. Datos y esquema del catálogo

Cada entrada de `CATALOGO`:
```
{ id, nombre, tipo: 'gob-estatal'|'gob-federal'|'banco'|'fundacion'|'plataforma'|'camara',
  cobertura: 'nacional'|'<Estado>',
  monto: [lo, hi] (MXN; [0,0] = apoyo no monetario),
  destinos: ['capital','equipo','expansion','innovacion','marketing','inventario','otro'],
  formalidad: ['constituida','resico','informal','cualquiera'], min_anios: n,
  donde: 'contacto real (correo/teléfono/dirección/portal)',
  desc, pros: [], contras: [] }
```

## 5. Mantenimiento del catálogo (lo importante)

- Los programas **cambian** (convocatorias, teléfonos, montos). Revisar cada ~3 meses o antes de una solicitud real.
- **Actualizar un programa:** editar su entrada en `CATALOGO` (fechar el cambio en `docs/CONTRATO.md` §Cambios).
- **Agregar programa:** añadir objeto al arreglo con fuente/contacto verificados — **nunca inventar** montos ni contactos (invariante #2).
- **Quitar programa caducado:** marcarlo en `contras` o eliminarlo con nota en `CONTRATO.md`.

## 6. Despliegue

- Commit a `main` (MASTER lo sirve desde el repo). Sin pipeline propio.

## 7. Backups y restauración

- El perfil del usuario vive solo en su navegador (sin respaldo, aceptado). El catálogo se respalda con git.

## 8. Logs, monitoreo y alertas

- Sin logs. Diagnóstico: consola del navegador (debe estar vacía).

## 9. Problemas frecuentes (operación)

| Síntoma | Causa probable | Acción |
|---|---|---|
| Página vacía en MASTER | Error JS tras edición | `node --check app.js` + consola |
| Ranking raro (programa obvio abajo) | `monto`/`formalidad` del programa mal declarados | Revisar la entrada del programa en `CATALOGO` |
| Contacto equivocado | Catálogo desactualizado | Verificar con la fuente y actualizar |

## Datos pendientes de validar

- [ ] Revisión trimestral de vigencia del catálogo (registrado en `GuiaTotal/PENDIENTES.md`)
