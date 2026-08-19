# ADR-016: Método Pareto 20/80 aplicado al prompt de `generateVideJson()`

## Status
Accepted (2026-07-31)

## Context
El usuario pidió complementar el prompt de guion de VIDE con un método de 4 parámetros para perfiles de contenido de alta conversión: Ancla de Identidad Visual, Matriz de Estado Mental, Arquetipo de Comunicación, Librería de Pattern Interrupts. Diagnóstico previo: 3 de los 4 ya tenían cobertura parcial en el prompt existente (conciencia≈matriz mental, pattern_interrupt/sfx≈disrupción, camara/animacion≈ancla visual parcial); el Arquetipo de Comunicación era genuinamente nuevo.

## Decision
1. **Ancla de Identidad Visual**: nueva sección de prompt que fija UNA dirección de ritmo de corte + UNA dirección de luz/color para TODO el guion (antes se decidía escena por escena, sin coherencia entre ellas).
2. **Matriz de Estado Mental**: la instrucción abstracta de "adapta el tono" se reemplazó por una técnica concreta por nivel: Inconsciente→choque visual, Consciente_Problema→empatía/historia, Consciente_Solución+→prueba/demostración.
3. **Arquetipo de Comunicación** (nuevo): Mentor/Antagonista/Par — la IA elige uno según conciencia/template y lo sostiene en todo el guion. Sin campo nuevo en la UI por ahora (la IA decide, mismo patrón que plantilla-por-conciencia); se puede exponer como selector manual después si hace falta más control.
4. **Librería de Pattern Interrupts**: nueva tabla Supabase `video_pattern_interrupts` (nicho + 'GENERAL' de respaldo), nuevo endpoint `GET /api/pattern-interrupts`, el prompt inyecta el catálogo real y le pide a la IA elegir de ahí para la escena 1 en vez de improvisar. Sembrada con 5 interrupts GENERALES (no se inventaron "específicos" de nicho sin dato real del usuario — la tabla queda lista para ampliarse por nicho después).

## Files
- `Documentacion/migrations/005_pattern_interrupts.sql` (documental; aplicado directo vía Supabase MCP)
- `SuitCampanas/local-server-node.js` — endpoint `GET /api/pattern-interrupts`
- `SuitCampanas/script.js` — `generateVideJson()`: fetch del catálogo + 4 secciones nuevas/reforzadas del prompt

## Validación
- `node --check` en ambos archivos ✓
- `GET /api/pattern-interrupts?nicho=Solar` (nicho sin entradas propias) contra el servidor real: responde con los 5 GENERAL de respaldo ✓
- Tabla verificada en Supabase: 5 filas, RLS con SELECT abierto (catálogo de referencia, no dato sensible por tenant) ✓

## Consequences
- El Arquetipo de Comunicación y el catálogo de interrupts no tienen UI propia todavía — están 100% controlados por el prompt/AI. Si se necesita override manual, es un paso siguiente natural (mismo patrón que el selector de estilos visuales).
- La tabla `video_pattern_interrupts` queda con un solo nicho ('GENERAL') sembrado — cualquier nicho real que se agregue después necesita sus propias filas para dejar de usar el respaldo genérico.
