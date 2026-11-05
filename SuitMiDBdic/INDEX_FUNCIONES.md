# Índice de funciones — SuitMiDBdic
**Generado:** 2026-10-18 · **Alcance:** `SuitMiDBdic/` · Complementa el `INDEX_FUNCIONES.md` de la raíz, que solo cubre `.js/.gs` y no ve el JS embebido en `dictionary.html`.

Líneas de `dictionary.html` (4778 líneas). Si el archivo crece, los números se desplazan: regenerar con `grep -n -E "^\s*(async\s+)?function\s+\w+" dictionary.html`.

## Mapa del archivo `dictionary.html`
| Líneas | Bloque |
|---|---|
| 1–211 | `<head>`, CSS, HTML estático (header, buscador, `#nav`, `#main`) |
| 212–3562 | `<script>` de **datos**: `const D={}` + `D.<clave>=...` (≈190 claves, una o varias por sección) |
| 3563–4778 | `<script>` de **lógica**: navegación, render (`build()`), búsqueda, glosario, IA, quiz, ticker |

## Navegación y estructura (3565–3627, 4372)
| Línea | Símbolo | Qué hace |
|---|---|---|
| 3565 | `SECTIONS` | Lista `[id, título]` de las 53 secciones |
| 3597 | `PARTS` | 6 Parts temáticas `{k,label,sections[]}`; el orden aquí es el orden de aprendizaje |
| 3605 | `SECTION_TO_PART` | Mapa `sectionId → part.k` (derivado de `PARTS`) |
| 3607 | `CURRENT_PART` | Part activa |
| 3608 | `renderPartTabs()` | Pestañas de las 6 Parts |
| 3611 | `renderNavForPart(partKey)` | Chips de la Part, numerados 1..N local |
| 3619 | `selectPart(partKey, autoShowFirst)` | Cambia de Part (y muestra su 1ª sección) |
| 4372 | `show(id, btn)` | Muestra una `<section class="topic">`, cambia de Part si hace falta |

## Utilidades (3629–3706)
| Línea | Símbolo | Qué hace |
|---|---|---|
| 3629 / 3630 | `esc` / `escAttr` | Escape HTML / de atributo |
| 3631 | `ipaBlock(title, arr)` | Rejilla de símbolos IPA |
| 3635 | `loadVoices()` | Carga voces de `speechSynthesis` |
| 3637 | `speak(text)` | Pronuncia con TTS del navegador |
| 3646 | `spkBtn(text)` | HTML del botón 🔊 |
| 3648 | `EXLVL` | Etiquetas de nivel de ejemplos (A1/A2 … nativo) |
| 3656 | `exSrc(id)` | Fuente de ejemplos por sección |
| 3687 | `shuffle(a)` | Fisher-Yates |
| 3688 | `exRender(e, lvl)` | Render de un ejemplo por nivel |
| 3689 / 3696 | `exPick` / `exRand` | Elegir nivel / ejemplo al azar |
| 3697 | `exWidget(id, opts, topic)` | Widget de ejemplos por nivel (guarda en `D.exLvl`) |

## Render principal
| Línea | Símbolo | Qué hace |
|---|---|---|
| 3708–4266 | `build()` | Genera todo el HTML de las 53 secciones (un bloque comentado `/* N TÍTULO */` por sección) y lo inyecta en `#main`; llama `renderPartTabs()` |

## Búsqueda, ruta de inicio y glosario (4268–4371)
| Línea | Símbolo | Qué hace |
|---|---|---|
| 4268 | `SEARCH_INDEX` | Índice plano `{en,es,sectionId,chipFn,chipArg,ipa}` |
| 4269 | `buildSearchIndex()` | Lo construye desde `D.vocab`, `antonyms`, `synonyms`, `phrasal`, `chunks`, `collocations`, `homophones`, `minPairs`, `falseFriends`, `vsplit`, `mentalModelsCase`, `workhorseVerbs`, `multiModals`, `nounsExamples`, `adjExamples`… |
| 4292 | `searchWord(q)` | Filtra (máx. 20) por EN o ES |
| 4297–4307 | `LAST_SEARCH_RESULTS`, `renderSearchResults(q)`, `jumpToSearchResult(i)` | Muestra y salta al resultado |
| 4317 | `STARTPATH` | 12 pasos `{id, why, go}` de la ruta de principiante |
| 4331 / 4332 | `goStartPath(i)` / `renderStartPath()` | Saltar / renderizar la ruta |
| 4342 | `GLOSSARY_ITEMS` | Glosario A-Z (~759 palabras dedupeadas desde `SEARCH_INDEX`; se actualiza solo) |
| 4343 / 4366 | `renderGlossary()` / `jumpFromGlossary(i)` | Render / salto |

## IA (requiere SuitAI en :3010 vía proxy `/api/generar`)
| Línea | Símbolo | Qué hace |
|---|---|---|
| 4379 | `AILAB_LEVEL_DESC` | Descripción de nivel para el prompt |
| 4386 | `generarIA()` | Laboratorio: 5 oraciones EN/ES sobre un tema (sección `ailab`) |
| 4406 | `generarNoticias(cat, btn)` | Noticias con IA (sección `news`) |

## Selectores de chip por sección (4425–4746)
Cada `showX` pinta el subcontenido de un chip dentro de su sección; es el `chipFn` que usan búsqueda, glosario y `STARTPATH`.

| Línea | Función | Sección |
|---|---|---|
| 4425 | `showIpaCat(idx,btn)` | ipa |
| 4462 | `showVocab(k,btn)` | vocab |
| 4467 | `showChunkCat(cat,btn)` | chunks |
| 4471 / 4476 / 4480 | `showPhrasalCat` / `showPhrasalExtra` / `showParticle` | phrasal |
| 4487 | `showArticleCat(cat,btn)` | articles |
| 4494 / 4502 | `showMentalModel` / `showMentalModelCase` | mentalmodels |
| 4508 | `showStructCat(idx,btn)` | structures |
| 4528 | `showVSplit(idx,btn)` | vsplit |
| 4535 / 4540 | `showContrCat` / `showContrExtra` | contr |
| 4548 | `showConjCat(k,btn)` | conj |
| 4553 / 4558 | `showPrepCat` / `showPrepExtra` | prep |
| 4568 | `showPopCat(cat,btn)` | popculture |
| 4573 | `showVariationCat(t,btn)` | variations |
| 4579 | `showEsIdiomCat(cat,btn)` | esidioms |
| 4584 / 4619 / 4629 | `showVerbType` / `showIrregularPattern` / `showStative` | vtypes |
| 4639 | `showMultiUse(group,idx,btn)` | multiuse |
| 4656 / 4671 | `showCitizenship` / `showCitizenshipByIndex` | citizenship |
| 4675 | `showTense(idx,btn)` | tenses |
| 4687 / 4720 | `showNouns` / `showNounsByIndex` | nouns |
| 4724 / 4742 | `showAdj` / `showAdjByIndex` | adj |

## Quiz, ticker y arranque (4748–4778)
| Línea | Símbolo | Qué hace |
|---|---|---|
| 4748 / 4758 | `newQuiz()` / `answer(w)` | Quiz de pares mínimos (`D.minPairs`) |
| 4766 | `nextTick()` | Rota `D.ticks` cada 9 s (`setInterval`) |
| 4772 | `build()` | **Arranque**: render inicial |
| 4773 | `fitHeader()` | Ajusta `--headerH`; se engancha a `resize`/`orientationchange` |

## `index.js` (servidor Express, :3013)
| Ruta | Qué hace |
|---|---|
| `GET /` | Sirve `dictionary.html` |
| `static` | Sirve la carpeta (incluye el HTML legado) |
| `POST /api/generar` | Proxy a `SUITAI_URL` (def. `http://localhost:3010`) `/api/ai/chat`; evita CORS. 400 sin `prompt`, 502 si SuitAI falla |
| `GET /api/health` | `{status:'ok', module:'SuitDiccionario', port:3013}` |

## `check.js` (`npm run check`)
Valida `dictionary.html` sin ejecutarlo: (1) sintaxis del JS embebido con `vm.Script`, (2) balance de tags HTML, (3) ids de `SECTIONS` ↔ `<section id>`.

## Claves de datos `D.*` (212–3562)
Una clave por tema; arrays de tuplas o de objetos. Agrupadas por sección:

- **Verbos:** `tenses`, `goingToNote`, `verbTypes`, `mainVerb*`, `irregularPatterns*`, `stative*`, `verbRules`, `edSounds*`, `phrasal`, `phrasalCats`, `offExtra`, `particles`, `vsplit*`, `workhorseVerbs`, `multiModals`, `certaintyScale*`, `getUses`/`setUses`/`wouldUses`/`beUses`, `conditionals`, `condRules`, `wishHope`, `passive*`, `gerund*`, `reported*`, `imperative`, `infPurpose`, `verbObjInf`
- **Sonidos:** `ipaV/ipaD/ipaC`, `vowelPairs`, `consClass/Place/Voice`, `schwaPrefix`, `minPairs`, `clusters`, `glottalT`, `silent`, `connected`, `stressPairs`, `homophones`, `nearHomophones`, `homoTriples`, `homonyms`, `dialects`
- **Piezas:** `pluralRules/Irr`, `nouns*`, `adj*`, `adjOrder*`, `articles*`, `mentalModels*`, `pronouns`, `indefPron`, `saxonGen`, `wh`, `doDoesDid*`, `subjQuest*`, `prepositions`, `prepCats`, `prepFixed`, `byExpr`, `onUpon`, `conjunctions`, `conjRules`, `advTypes/Rules/Examples`, `negation`, `neg*`
- **Vocabulario:** `vocab`, `chunks`, `chunksCats`, `collocations`, `synonyms`, `antonyms`, `posNeg`, `falseFriends`, `confusSpelling`, `confusTrios`, `prefixes`, `suffixes`, `spellingRules`
- **Registro y estilo:** `variations`, `brAm*`, `contractions`, `contrCats`, `contrExamples`, `contrPractice`, `popPhrases`, `popCats`, `esIdioms`, `esIdiomCats`, `idiomComp`, `frenchRules/Words`, `frameworks`
- **Aplicado:** `citizenship`, `citizenshipCats`, `n400`, `newsCats`
- **Transversales:** `ticks` (ticker), `exLvl` (nivel de ejemplos), `structCats`, `compRules`, `comparatives`, `compStructures`

## Índice de estructuras gramaticales (2026-10-18)
`buildSearchIndex()` ahora también indexa estructuras, no solo vocabulario: aparecen en la búsqueda y en el glosario A-Z. Líneas aproximadas (el archivo creció ~20 líneas tras `D.doubleContrNote`; regenerar el mapa si hace falta).

| Estructura / etiqueta de búsqueda | Sección | Chip / fuente |
|---|---|---|
| `I had something` (past simple de HAVE) | contr | chip «have: had / would have» · `D.haveUses` |
| `I'd had`, `I had had` (past perfect) | contr | idem |
| `I would have`, `I'd have` (condicional) | contr | idem |
| `I would have had` (3er condicional) | contr | idem |
| `✗ I would had` (incorrecto) | contr | idem |
| Tiempos verbales (`Past Perfect · S + had + V3`, etc.) | tenses | `showTense(i)` · `D.tenses` |
| Condicionales (`2nd/3rd/Mixto · If + …, would have + V3`) | cond | `D.conditionals` |

Datos nuevos: `D.haveUses`, `D.haveUsesNote` (junto a `D.doubleContrNote`). Render: rama `kind==="have"` en `showContrExtra`. Índice: 3 líneas nuevas al final de `buildSearchIndex()`.

### such / so (2026-10-18)
Sección **confuse** (Palabras que se confunden), `D.confusTrios`: tarjeta «such a / such / so» (+ `D.suchRule`) y nueva tarjeta «so / such en otros usos» (so…that, such…that, so much/many, So do I, so that, such as). Ambas se indexan en `buildSearchIndex()` (sección `confuse`).

## Actualización 2026-11-05
Los números de línea de arriba corresponden al 2026-10-18; tras añadir secciones y datos se desplazaron (regenerar con grep si se necesitan exactos).
- **Secciones nuevas (Part III):** `verbpatterns` (chip 10, datos `D.vp*`, bloque `/* 28b · VERB PATTERNS */` en `build()`) y `relative` (chip 12, datos `D.rel*`, bloque `/* 35c · ORACIONES DE RELATIVO */`). Ambas con caso propio en `exSrc()`, nivel en `D.exLvl` y entradas en `buildSearchIndex()`.
- **Helpers en `build()`:** `igHl(s)` / `igPlain(s)` — en los datos `D.vp*`, `*texto*` marca la forma resaltada.
- **CSS:** clases `.ig-*` (tarjetas infográficas pastel: `inf, ger, both, warn, info, tip`) y bloque «Tarjetas pastel en TODAS las secciones» (selector `section.topic`).
