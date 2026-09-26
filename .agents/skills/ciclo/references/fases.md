# Fases: criterios de entrada y salida

Una fase no se cierra sin su commit y sin su condición observable cumplida.

## F0 Alcance y contrato
- Entrada: invocacion del ciclo en una carpeta (proyecto raiz o subproyecto).
- Salida observable: linea `Alcance: <ruta> · Contrato: <archivo o NUEVO>`. Si el contrato no existia, `CONTRATO.md` creado en el alcance, con seccion POR CONFIRMAR mostrada al usuario, y su commit.
- Regla: sin contrato resuelto no se abre F1. Ver `alcance.md`.

## F1 Encuadre 20/80
- Entrada: alcance y contrato resueltos, hay cambios detectados o un objetivo del usuario.
- Salida observable: lista escrita de 1 a 5 acciones elegidas + lista de lo descartado.
- Regla: si una acción no cambia comportamiento observable ni reduce riesgo, va a descartados.

## F2 Implementación
- Entrada: lista de F1 aprobada por ti mismo o por el usuario.
- Salida observable: `git diff` limitado a los archivos previstos. Si tocaste algo fuera de la lista, justifícalo en el mensaje de commit.
- Prohibido: refactors oportunistas, renombres masivos, cambios de formato no pedidos y cualquier edicion fuera del alcance (pide permiso y abre otro ciclo).

## F3 Validación
- Entrada: código modificado.
- Salida observable: `VALIDACION.md` del alcance con cada prueba, comando ejecutado, resultado real y veredicto PASA/FALLA.
- Sin evidencia ejecutada no hay PASA. "Debería funcionar" es FALLA.

## F4 Iteración
- Entrada: al menos un FALLA.
- Salida observable: nueva ronda en `VALIDACION.md` y una entrada nueva en `CORRECCIONES.md` con causa raíz y regla para el futuro.
- Tope: 3 rondas. A la cuarta, detente, resume las hipótesis agotadas y pregunta.

## F5 Plan de sincronización
- Entrada: validación en PASA.
- Salida observable: `PLAN-SYNC.md` con deltas de esquema (campos añadidos/eliminados/renombrados), deltas de registros, empresas afectadas y motor destino de cada una.
- Nada se escribe en ninguna base en esta fase.

## F6 Visto bueno y ejecución
- Entrada: `PLAN-SYNC.md` mostrado al usuario.
- Salida observable: aprobación explícita citada en el commit, más log de ejecución por empresa.
- Si la aprobación es parcial, ejecuta solo lo aprobado y deja el resto en el plan.

## F7 Cierre GitHub
- Entrada: ciclo cerrado.
- Salida observable: push realizado o anotación "push aplazado por decisión del usuario".
- Nunca `push --force`, nunca a `main` si el proyecto usa ramas de trabajo.

## Salto de fases
Permitido cuando: no hay diff en el alcance (salta F2–F7), el cambio no toca datos (salta F5–F6), el usuario pide explícitamente solo commits locales (salta F7). Declara siempre qué fases saltaste y por qué.
