# SuitDiccionario

Diccionario inglés↔español interactivo (IPA, gramática, vocabulario temático, quizzes, generación con IA). Un solo archivo (`dictionary.html`, JS embebido) servido por `index.js` (Express, puerto 3013).

## Uso
```
npm start          # levanta el servidor en :3013
npm run check       # valida dictionary.html antes de confiar en el navegador
```

## Por qué existe `npm run check`

`dictionary.html` es un solo archivo que ya pasó las ~4,000 líneas (datos + render + estilos). A ese tamaño, un error de sintaxis o un tag sin cerrar deja de ser visible a simple vista — y el navegador no avisa con un error claro, solo se ve raro o se rompe en silencio.

`check.js` corre 3 verificaciones antes de confiar en un cambio:
1. **Sintaxis del JS embebido** — parsea el `<script>` con `vm.Script`, sin ejecutarlo.
2. **Balance de tags HTML** (div, section, table, tr, td, button, h2, h3) — cuenta aperturas vs cierres.
3. **Integridad de ids de sección** — cada id en `SECTIONS` debe tener exactamente un `<section id="...">` en el HTML (ni duplicado, ni huérfano).

Correr `npm run check` después de cualquier edición a `dictionary.html`, antes de darla por buena.

**Alcance:** por ahora este check es local a SuitMiDBdic, no forma parte de las reglas generales de SuitOS (`.suit/workflows/feature.yaml`). Si en el futuro se vuelve una práctica útil para otros módulos de un solo archivo, se puede promover ahí.
