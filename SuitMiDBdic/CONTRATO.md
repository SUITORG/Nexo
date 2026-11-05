# CONTRATO — SuitMiDBdic (SuitDiccionario)
Alcance: `SuitMiDBdic/` · Contrato padre: `CLAUDE.md` raíz (no hay `CONTRATO.md` en la raíz) · Fecha: 2026-10-18

## Propósito
Diccionario inglés↔español interactivo para aprender: IPA, gramática, vocabulario temático, quizzes, ejercicios por nivel, 150 preguntas de ciudadanía de EE.UU. y generación de oraciones/noticias con IA. Candidato a convertirse en libro vendible por Parts.

## Stack y ejecución
- Runtime: Node.js + Express 4 (`index.js`); front en **un solo archivo** `dictionary.html` (HTML+CSS+JS embebido, sin build).
- Comandos: instalar `npm install` · desarrollo `npm start` (o `run.bat`, con loop de espera y `server.log`) · pruebas `npm run check` · build: ninguno.
- Variables de entorno: `PORT` (def. 3013), `SUITAI_URL` (def. `http://localhost:3010`).
- Mapa de funciones y datos: `INDEX_FUNCIONES.md` (mantener al día cuando cambien las líneas/funciones).

## Datos y multi-inquilino
- Consume `Config_Empresas`: **no**. Sin base de datos: todo el contenido vive en `const D={...}` dentro del HTML.
- Motores soportados: ninguno (no aplica sync GSHEETS/SUPABASE/NEON → fase 5/6 del ciclo se omite).
- Registro: `suit-diccionario` en `.suit/registry/projects.yaml` (puerto 3013, `public_route: "#diccionario"`, disponible para todas las empresas).
- Aislamiento por empresa: no aplica (contenido común, sin datos de inquilinos).

## Límites
- Puede modificar: `SuitMiDBdic/dictionary.html`, `index.js`, `check.js`, `run.bat`, `stop.bat`, `README.md`, `package.json`, docs de esta carpeta.
- No debe tocar: el resto del monorepo; `.wwebjs_auth/` (sesión de WhatsApp ajena); `📘-v33-FINAL-...html` (versión legada, solo referencia).
- Dependencias externas: SuitAI (:3010) solo para `/api/generar`; el resto funciona offline. Voces vía `speechSynthesis` del navegador.
- No pasa por SSG ni por el deploy de `grupoevasol.com`.

## Invariantes (no romper nunca)
1. `npm run check` pasa (sintaxis JS, balance de tags, ids de `SECTIONS` ↔ `<section id>`) antes de dar por buena cualquier edición.
2. Cada Part debe poder valerse por sí sola (posible libro por Parts); las referencias cruzadas son **por nombre de sección**, nunca por número global.
3. `glossary` y búsqueda se alimentan de `SEARCH_INDEX`; el contenido nuevo se agrega a `D.*` y a `buildSearchIndex()`, no se duplica a mano.
4. Cambios multi-archivo o que reorganizan estructura (renumerar, mover secciones, sistemas transversales) van con **plan escrito previo** y aprobación. Agregar vocabulario/ampliar un chip es edición directa.
5. Arreglos masivos por regex requieren auditoría semántica línea a línea (un pase ciego produjo ~50 referencias erróneas).
6. `check.js` es local a este proyecto; no promoverlo a `.suit/workflows/feature.yaml` sin decisión explícita.

## Definición de terminado
- `npm run check` OK + carga en Playwright con 0 errores de consola + ejercitar la UI cambiada + captura en escritorio y 390 px.
- Evidencia en `VALIDACION.md`; commit por fase.
- `INDEX_FUNCIONES.md` actualizado si cambió la estructura del JS.

## Anexo heredado
- `bug suitmidbdic-no-abre` (`.suit/memory/bugs/`): `package.json` local y `run.bat` con verificación de arranque — pendiente confirmar con doble clic real.

## POR CONFIRMAR
- `origen.txt` parece un prompt de un dashboard DeFi/cripto, sin relación con el diccionario: ¿mover a SuitBoard o borrar?
- `server.log`, `server_check.log` y `.wwebjs_auth/`: ¿ignorar en git / limpiar?
- ¿Se mantiene el HTML legado `📘-v33-FINAL-...html` o se archiva?
- Estado de la ruta pública `#diccionario` declarada en el registro: no verificada.
- Pendiente de datos: `README` dice "Un solo archivo" pero ya existen ~190 claves `D.*`; si se parte en libro por Parts, definir cómo se extraen los datos.

## Cambios
- 2026-10-18: contrato inicial (fase 0) + `INDEX_FUNCIONES.md` desde el código real.
- 2026-10-18: chip «have: had / would have» (Contracciones) + índice de estructuras (tenses, cond, have) en SEARCH_INDEX.
- 2026-10-18: tarjeta «so / such en otros usos» en Palabras que se confunden + indexado de such/so en SEARCH_INDEX.
- 2026-11-05: secciones nuevas `relative` (Oraciones de relativo) y `verbpatterns` (Verb patterns) en la Part III; estilo pastel global (`section.topic`) + clases reutilizables `.ig-card` (infográficos). Total: 53 secciones.
