---
name: mojibake
description: "Detecta y repara mojibake (UTF-8 doble-codificado como CP1252: â€¢, Ã­, vacÃ­a, acentos rotos) en archivos del repo. Úsala cuando el usuario diga 'mojibake', 'acentos rotos', 'letras raras', 'Ã' o 'â€ en los textos', 'basura en acentos', después de cualquier bulk-edit con PowerShell (Get-Content/Set-Content), o cuando la llamén `auditoria` (fase de inventario) o `ciclo` (fase de validación). Diagnóstico por defecto; `--fix` repara. Causa raíz: PS5.1 lee UTF-8 como ANSI."
license: MIT
compatibility: "Claude Code y opencode. Requiere node."
metadata:
  author: Roberto Padron
  version: "1.0"
---

# Mojibake — diagnóstico y repair de encoding

> **Propósito:** encontrar y revertir UTF-8 leído como CP1252 (una capa) en archivos de texto. Un solo archivo o todo un directorio.

## Cuándo se invoca

- El usuario reporta acentos rotos (`Ã©`, `â€"`, `vacÃ­a`, `Ã±`…).
- **Después de un bulk-edit con PowerShell** (`Get-Content`/`Set-Content` sin `-Encoding UTF8` → PS5.1 usa ANSI). Prevención: no usar esas cmdlets en UTF-8; preferir la herramienta `edit` o node.
- `auditoria` → Fase 1 (inventario): corre diagnóstico sobre los archivos/ directorios del alcance.
- `ciclo` → Fase 3 (validación): corre diagnóstico sobre los archivos tocados en la fase, antes del commit.

## Uso

```bash
# Diagnóstico (no toca nada) — archivo o carpeta (recursivo)
node .agents/skills/mojibake/mojibake.js <ruta>...
node .agents/skills/mojibake/mojibake.js SuitMisCtas GuiaTotal/MAPA.md

# Reparar (quita BOM si existe; una sola capa CP1252→UTF-8)
node .agents/skills/mojibake/mojibake.js <ruta> --fix
```

- **Diagnóstico:** imprime por archivo `moji` (conteos de patrones `Ã­` `Ã¡` `Ã©` `Ã³` `Ã±` `â€”`…) y `ok` (acentos correctos). `moji > 0 && ok ≈ 0` = mojibake confirmado.
- **`--fix`:** revierte solo si todos los caracteres no-ASCII son reversibles CP1252 (aborta con `CHAR NO REVERSIBLE` si hay una capa más — no forcear).
- **Regla:** revisar el reporte antes de `--fix` — un archivo legítimamente puede contener `Ã` (docs sobre encoding, tests). Si hay duda, mirar el archivo primero.

## Alcance de extensiones (al pasar una carpeta)

`.html .htm .js .mjs .cjs .css .md .yaml .yml .json .bat .ps1 .txt .csv .svg` — salta `.git`, `node_modules`, `dist`, `respaldos`, `media`.

## Salida

- Línea por archivo: `FIXED` / `OK` / `MOJI(n)` / `SKIP`.
- Resumen final: `archivos: N | reparados: R | con moji: M`.
