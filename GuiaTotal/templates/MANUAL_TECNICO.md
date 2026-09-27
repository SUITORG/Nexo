# MANUAL TÉCNICO — [NOMBRE PROYECTO]

> **Para qué sirve este manual:** documenta el backend para quien mantiene y configura el sistema: arquitectura, variables de entorno, base de datos, despliegue, monitoreo y recuperación.
> **Audiencia:** backend — desarrollador o administrador técnico del proyecto.
> **Versión:** 1.0 · **Última actualización:** [FECHA] · **Stack:** [STACK] · **Puerto(s):** [PUERTOS]

---

## Para qué sirve este manual (detalle)

Este manual es el manual de mantenimiento y configuración. Cubre cómo está construido el sistema por dentro, cómo se ejecuta, cómo se configura, cómo se respalda y cómo se recupera ante fallos. No cubre el uso de la interfaz (`MANUAL_CLIENTE.md` / `MANUAL_PROVEEDOR.md`) ni solo pruebas (`MANUAL_PRUEBAS.md`).

## 1. Arquitectura general

```text
[Frontend] → [API/Backend] → [Base de datos] → [Servicios externos]
```

[Describir componentes, puertos y comunicación en 5-10 líneas.]

## 2. Stack y ejecución

- Runtime / lenguaje:
- Comandos: instalar `...` · desarrollo `...` · build `...` · producción `...`
- Puertos:

## 3. Variables de entorno

| Variable | Para qué sirve | Obligatoria |
|---|---|---|
| `[VAR]` | [uso] | sí/no |

**Nunca** committing secretos al repo.

## 4. Base de datos y esquema

- Motor: [GSHEETS / SUPABASE / NEON — según `db_engine`]
- Tablas principales y relaciones
- Migraciones: dónde viven y cómo se aplican
- Multi-tenant: todas las queries filtran `id_empresa`

## 5. Configuración

- Cómo se configura una empresa/tenant nuevo
- Flags relevantes (`usa_*`, `modo`)
- Integraciones externas (email, pagos, IA, webhooks)

## 6. Despliegue

- Pasos de deploy del proyecto
- Dónde corren los tests/validación previa

## 7. Backups y restauración

1. Qué se respalda
2. Frecuencia
3. Dónde se guarda
4. **Cómo restaurar (probado)**

## 8. Logs, monitoreo y alertas

- Dónde están los logs
- Qué errores monitorear
- A quién alertar y cómo

## 9. Problemas frecuentes (operación)

| Síntoma | Causa probable | Acción |
|---|---|---|
| [error] | [causa] | [comando/paso] |

## Datos pendientes de validar

- [ ] [qué falta confirmar antes de entregar este manual]
