# ADR-063: SuitAddCrediPatro — buscador de créditos/patrocinios estático con catálogo fechado

## Status
Accepted (2026-11-12)

## Context
El usuario quiere una herramienta personal: dado su tipo de negocio y zona, recomendar dónde acercarse a solicitar créditos y patrocinios (gobierno, privado, banca, fundaciones), preguntar lo necesario para identificar el problema de financiamiento, y generar un escrito de pros y contras para las entrevistas que mejore la probabilidad de aprobación. Requisito: uso personal, informativo, nada de trámites.

## Decision
Módulo estático `SuitAddCrediPatro/` (index.html + app.js vanilla, sin servidor ni APIs), integrado como botón/iframe en `MASTER.html` (patrón SuitOrgPViaje).

- **Catálogo estático fechado** (`CATALOGO`, 18 programas) fundamentado en investigación web 2026-11: Impulso Nuevo León/FOCRECE (microcréditos, garantía estatal, FIFA 2026), NAFIN (Impulso + Estados, Mujeres Empresarias, factoraje), FIFOMI, FIRA, banca PyME, fundaciones (Televisa/Coppel POSiBLE, Azteca/HEINEKEN/GIZ, Placemaking/AmEx, Tichi Muñoz), crowdfunding y cámaras (CAINTRA/CANACINTRA/COPARMEX). Cada entrada con contacto real.
- **Matching por scoring**: cobertura (estado vs nacional), solape de destinos, rango de monto, situación fiscal y antigüedad → ranking con razones visibles.
- **Argumentario generado**: pros del perfil, contras con blindaje, preguntas probables con respuestas sugeridas, checklist de expediente y cierre — copiable al portapapeles.

## Rationale
- Sin APIs de trámites ni scraping en runtime: los programas gubernamentales no tienen API estable y un catálogo editable fechado es mantenible y auditable.
- "No inventar programas ni montos" (invariante #2): el catálogo solo contiene programas verificados con fuente pública.
- Mismo patrón estático probado en SuitOrgPViaje: cero dependencias, cero credenciales.

## Consequences
- El catálogo caduca: requiere revisión de vigencia cada ~3 meses (registrado en `GuiaTotal/PENDIENTES.md`).
- La herramienta orienta y prepara, pero no garantiza aprobación ni sustituye asesoría profesional — dicho en la UI y en el argumentario.

## Related
- AGENTS.md: Standard for new modules, immutable rule #7
- `.suit/registry/projects.yaml`: suitaddcredipatro
- ADR-062 (patrón de módulos estáticos personales en MASTER)
