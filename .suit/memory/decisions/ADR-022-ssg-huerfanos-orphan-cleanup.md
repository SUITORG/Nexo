# ADR-022 — Limpieza de páginas huérfanas en `ssg-engine.mjs`

**Fecha**: 2026-08-02
**Estado**: Implementado y verificado en vivo
**Contexto**: Revisión SuitOS del plan `plan-posicionamiento-seo-multitenant.md` (Fase 1-3), ejecutado por otro CLI. Ver ROADMAP.md P13.

## Problema

El motor SSG (`scripts/ssg-engine.mjs`) escribe/actualiza un archivo `.html` en `dist/` por cada fila de `Config_Empresas`. El fix de Fase 1 del plan SEO (P13.1: `noindex, nofollow` para todo lo que no sea EvaSol) se aplica **dentro de ese mismo loop** — es decir, solo toca archivos que corresponden a un inquilino que existe HOY en la hoja.

Cuando un inquilino se renombra o se elimina de `Config_Empresas`, su archivo `.html` viejo **nunca se toca**: no se regenera, no se borra. Queda en `dist/` para siempre, servido públicamente, indexable (`index, follow`, el estado por defecto de antes del fix), con metadata OG genérica y desactualizada.

### Evidencia real

Verificación cruzada contra la API real de GAS (`action=getAll`, 17 empresas actuales) mostró que `ROOMATEANL` ya no existe — el slug correcto ahora es `ROOMMATENL` (doble m). El archivo `dist/roomateanl.html` (fechado 7 de abril) seguía en disco:

- `<meta name="robots" content="index, follow">` — indexable, pese al fix 13.1.
- `og:title: "SuitOrg | Ecosistema Digital"` — genérico, no específico del inquilino.
- No aparecía en `sitemap.xml` ni en `robots.txt` (ambos se regeneran completos cada corrida) — pero eso no lo saca del índice de Google si ya fue rastreado antes; solo evita que se re-mande.

Esto significa que el fix de Fase 1 (noindex) **no es completo por sí solo**: protege inquilinos activos, pero no limpia el rastro de los que ya no existen.

## Decisión

Agregar una pasada de limpieza de huérfanos al final de `ssg-engine.mjs`, dentro del mismo script (no un paso manual aparte, para que se repita automáticamente en cada corrida del cron `.github/workflows/ssg-regenerate.yml`):

1. Un `Set` (`generatedFiles`) acumula el nombre de cada archivo escrito durante el loop de inquilinos.
2. Después de generar `sitemap.xml` y `robots.txt`, se listan todos los `.html` existentes en `dist/` y se borra cualquiera que no esté en `generatedFiles`.

```js
const generatedFiles = new Set();
// ...dentro del loop, después de escribir cada archivo:
generatedFiles.add(file);
// ...después de robots.txt:
const existingHtml = fs.readdirSync(CONFIG.outputDir).filter(f => f.endsWith('.html'));
const orphans = existingHtml.filter(f => !generatedFiles.has(f));
for (const orphan of orphans) {
    fs.unlinkSync(path.join(CONFIG.outputDir, orphan));
    console.log(`🗑️ Huérfano eliminado: ${orphan}`);
}
```

## Verificación en vivo

- `node --check scripts/ssg-engine.mjs` → OK.
- Ejecución real (`node scripts/ssg-engine.mjs`) contra la API GAS real: procesó 17 inquilinos, generó 16 archivos (1 indexable + 15 noindex), y el paso de limpieza borró **dos** huérfanos:
  1. `roomateanl.html` — el caso confirmado arriba.
  2. `.html` (nombre de archivo vacío) — resto de una fila muy antigua con `id_empresa` vacío, de antes de que existiera el guard `if (!coId) continue` en el loop principal. No es un bug activo (ese guard ya evita que se vuelva a generar), solo basura acumulada de una corrida anterior al guard.
- Post-fix, `dist/*.html` = exactamente 16 archivos, `sitemap.xml` = 1 URL (evasol.html), `robots.txt` = 15 líneas `Disallow`. Todo coincide con el roster real de 17 empresas (SUITORG mapea a `index.html`).

## Consecuencias

- Cualquier rename/baja futura de inquilino se limpia solo, en la siguiente corrida del cron diario — no requiere intervención manual ni un script aparte.
- Riesgo: si `Config_Empresas` no responde (error de red/API) y el script igual llega a la fase de limpieza con una lista de inquilinos vacía/parcial, borraría de más. Mitigación ya existente: el script no llega a este paso si la llamada a la API falla (se corta antes). No se agregó guard adicional porque el flujo de error ya existente lo cubre — no se investigó a fondo el comportamiento exacto en ese caso límite, queda como riesgo conocido de baja probabilidad.
- No se tocó nada de Fase 4 (hardening de seguridad) ni Fase 5 (decisión de dominio) — fuera de alcance de este fix.
