#!/usr/bin/env bash
# Uso: detectar_cambios.sh [ruta-del-alcance]
# Resuelve el alcance (proyecto o subproyecto), su contrato y sus cambios pendientes.
set -uo pipefail

RAIZ="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
INICIO="$(cd "${1:-.}" 2>/dev/null && pwd || pwd)"

buscar_contrato() {
  for f in CONTRATO.md CONTRATOPRP.MD PRM.md; do
    [ -f "$1/$f" ] && { echo "$f"; return 0; }
    [ -f "$1/docs/$f" ] && { echo "docs/$f"; return 0; }  # convención GuiaTotal: docs/ del proyecto
  done
  return 1
}

# Sube desde INICIO hasta RAIZ buscando el primer directorio con contrato.
ALCANCE="$INICIO"; CONTRATO=""; DIR="$INICIO"
while : ; do
  if C="$(buscar_contrato "$DIR")"; then ALCANCE="$DIR"; CONTRATO="$C"; break; fi
  [ "$DIR" = "$RAIZ" ] && break
  PADRE="$(dirname "$DIR")"; [ "$PADRE" = "$DIR" ] && break; DIR="$PADRE"
done

REL="${ALCANCE#$RAIZ/}"; [ "$REL" = "$ALCANCE" ] && REL="."

echo "== Alcance =="
echo "ruta: $REL"
if [ -n "$CONTRATO" ]; then
  echo "contrato: $REL/$CONTRATO"
else
  echo "contrato: NUEVO -> crear en $REL/docs/CONTRATO.md (ver references/alcance.md)"
fi
if [ "$REL" != "." ] && C_RAIZ="$(buscar_contrato "$RAIZ")"; then
  echo "contrato padre: ./$C_RAIZ"
fi

echo "== Rama =="
git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "sin repo git"

echo "== Cambios sin commitear en el alcance =="
CAMBIOS="$(git status --porcelain -- "$ALCANCE" 2>/dev/null)"
if [ -z "$CAMBIOS" ]; then
  echo "NINGUNO -> se pueden saltar las fases de implementacion y sync"
else
  echo "$CAMBIOS"
  echo "-- resumen --"
  git diff --stat HEAD -- "$ALCANCE" 2>/dev/null
fi

echo "== Cambios fuera del alcance (no tocar sin permiso) =="
git status --porcelain 2>/dev/null | grep -v -F -- "${REL%.}" | head -20 || true

echo "== Archivos vivos del alcance =="
for f in VALIDACION.md CORRECCIONES.md PLAN-SYNC.md; do
  [ -f "$ALCANCE/$f" ] && echo "existe: $REL/$f" || echo "falta: $REL/$f (copiar de .claude/skills/ciclo/templates/$f)"
done

echo "== Contexto para redactar contrato (si falta) =="
ls -1 "$ALCANCE" | head -30
for f in README.md README.MD package.json; do [ -f "$ALCANCE/$f" ] && echo "fuente: $REL/$f"; done

echo "== Posible impacto en datos =="
git diff --name-only HEAD -- "$ALCANCE" 2>/dev/null | grep -Ei 'migra|schema|esquema|sheet|supabase|neon|config_empresas|db' || echo "sin archivos relacionados a datos en el diff"
