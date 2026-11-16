# MANUAL DE PRUEBAS - SuitAddCrediPatro

> **Para qué sirve este manual:** validar el módulo antes de subir cambios: sintaxis + recorrido E2E manual con dos perfiles de referencia.
> **Audiencia:** desarrollador del proyecto que valida cambios antes de subirlos.
> **Versión:** 1.0 · **Última actualización:** 2026-11-12 · **Plataforma:** SuitAddCrediPatro

---

## Para qué sirve este manual (detalle)

El módulo es estático y sin servicios externos: la validación es sintaxis + recorrido manual determinista. No cubre uso cotidiano ni mantenimiento.

## 1. Qué es el modo de pruebas

No hay flag de modo dev: no hay nada que mockear (sin APIs). La validación = recorrido con perfiles de referencia.

## 2. Activación rápida

```bash
node --check SuitAddCrediPatro/app.js
```

Abrir `index.html` (MASTER o `python -m http.server` temporal) y DevTools → consola (vacía).

## 3. Qué se mockea y qué no

| Servicio | En modo pruebas | En producción |
|---|---|---|
| APIs externas | no existen | no existen |
| Persistencia | `localStorage` del navegador de prueba | `localStorage` del usuario |
| Catálogo | el mismo siempre (estático) | idéntico |

## 4. Datos de prueba

Dos perfiles de referencia:
- **Perfil A (NL formal):** Nuevo León · RESICO · 2 años · 3 empleados · $1 MDP/año · $100-500k · capital de trabajo · urgencia media.
- **Perfil B (informal marketing):** informal · marketing + capital.

Estado limpio: DevTools → borrar `acp_perfil`.

## 5. Recorrido E2E completo

```text
[Perfil A → Analizar] → [diagnóstico capital de trabajo] → [top: Impulso NL/FOCRECE] → [argumentario] → [Copiar ✓]
[Perfil B → Analizar] → [suben fundaciones/POSiBLE] → [argumentario incluye blindaje de formalización]
```

Resultados esperados:
1. Perfil A: diagnóstico menciona "capital de trabajo"; primeros lugares Impulso NL / NAFIN+Estados (coincidencia ≥40 pts).
2. Argumentario trae secciones: caso en 3 líneas, PROS, CONTRAS con blindaje, preguntas probables, qué llevar, cierre.
3. «Copiar argumentario» → botón cambia a «Copiado ✓».
4. Perfil B: en top aparecen Fundaciones corporativas/POSiBLE; el argumentario incluye la línea de formalización (RESICO).
5. Sin destinos marcados → mensaje "Selecciona al menos un destino".

## 6. Criterios de pasada

- [ ] `node --check app.js` → OK
- [ ] Consola sin errores en ambos perfiles
- [ ] Perfil A: FOCRECE/NAFIN en top 3 con contactos reales
- [ ] Perfil B: blindaje de informalidad presente
- [ ] Copiar da feedback «Copiado ✓»

## 7. Problemas frecuentes del modo pruebas

| Problema | Causa | Solución |
|---|---|---|
| file:// bloqueado en Playwright | política del navegador automatizado | servir con `python -m http.server` temporal |
| Perfil recordado de una prueba previa | `acp_perfil` en localStorage | borrarlo o usar «Limpiar» |

## Datos pendientes de validar

- [ ] Ninguno
