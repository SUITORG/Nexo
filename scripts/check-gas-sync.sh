#!/usr/bin/env bash
# Compara backend/*.js local contra el código realmente desplegado en el proyecto
# GAS canónico (.suit/registry/gas-deployments.yaml) — automatiza lo que se hizo a
# mano el 2026-09-23 (clasp pull a una carpeta temporal + diff). No reemplaza el
# juicio de si desplegar; solo hace visible el drift antes de darlo por hecho.
#
# Uso: bash scripts/check-gas-sync.sh
# Requiere: clasp autenticado (clasp login) con acceso al proyecto canónico.

set -euo pipefail
cd "$(dirname "$0")/.."

REGISTRY=".suit/registry/gas-deployments.yaml"
SCRIPT_ID=$(grep -A2 '^canonical_project:' "$REGISTRY" | grep 'scriptId:' | head -1 | sed -E 's/.*scriptId: *"([^"]+)".*/\1/')

if [ -z "$SCRIPT_ID" ]; then
    echo "❌ No se pudo leer scriptId canónico de $REGISTRY"
    exit 2
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "🔄 Jalando código real del proyecto canónico (scriptId $SCRIPT_ID)..."
cat > "$TMPDIR/.clasp.json" <<EOF
{
  "scriptId": "$SCRIPT_ID",
  "rootDir": "."
}
EOF

if ! (cd "$TMPDIR" && clasp pull >/dev/null 2>&1); then
    echo "❌ clasp pull falló — ¿estás logueado? (clasp login)"
    exit 2
fi

DRIFT=0
echo ""
echo "Comparando backend/*.js vs proyecto GAS real:"
echo "----------------------------------------------"

for local_file in backend/*.js backend/*.gs; do
    [ -f "$local_file" ] || continue
    name=$(basename "$local_file")
    base="${name%.*}"
    # clasp pull siempre normaliza el archivo remoto a .js, sin importar si
    # localmente se llama .gs (ej. event-logger.gs) — comparar por nombre base.
    remote_file="$TMPDIR/$base.js"
    if [ ! -f "$remote_file" ]; then
        echo "⚠️  $name — SOLO LOCAL (nunca se hizo clasp push de este archivo)"
        DRIFT=1
    elif ! diff -q "$local_file" "$remote_file" >/dev/null 2>&1; then
        echo "❌ $name — DIFIERE (local tiene cambios sin desplegar, o el remoto tiene cambios sin traer)"
        DRIFT=1
    else
        echo "✅ $name — igual"
    fi
done

for remote_file in "$TMPDIR"/*.js; do
    [ -f "$remote_file" ] || continue
    name=$(basename "$remote_file")
    base="${name%.*}"
    if [ ! -f "backend/$base.js" ] && [ ! -f "backend/$base.gs" ]; then
        echo "⚠️  $name — SOLO REMOTO (existe en GAS pero no en backend/ local)"
        DRIFT=1
    fi
done

echo "----------------------------------------------"
if [ "$DRIFT" -eq 0 ]; then
    echo "✅ backend/ local y el proyecto GAS real están en sync."
else
    echo "⚠️  Hay drift — revisa arriba antes de dar el cambio por terminado."
    echo "    Fix típico: clasp push (si local está adelante) o clasp pull a backend/ (si el remoto tiene algo que no bajaste)."
fi
exit $DRIFT
