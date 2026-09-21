#!/usr/bin/env bash
# Uso: commit-fase.sh <n> "<fase>" "<resumen>" [alcance] [db_engine] [objetivo]
# Commitea el resultado de una fase del ciclo de mantenimiento.
set -euo pipefail
N="${1:?numero de fase}"; FASE="${2:?nombre de fase}"; RESUMEN="${3:?resumen}"
ALCANCE_IN="${4:-.}"; ENGINE="${5:-n/a}"; OBJETIVO="${6:-ciclo}"
RAIZ="$(git rev-parse --show-toplevel)"; cd "$RAIZ"
ALCANCE="$(cd "$ALCANCE_IN" && pwd)"
REL="${ALCANCE#$RAIZ/}"; [ "$REL" = "$ALCANCE" ] && REL="."

if [ -z "$(git status --porcelain -- "$ALCANCE")" ]; then
  echo "sin cambios en $REL: no se crea commit en la fase $N ($FASE)"
  exit 0
fi

git add -A -- "$ALCANCE"
git commit -m "ciclo(f${N}/${FASE})[${REL}]: ${RESUMEN}" -m "Alcance: ${REL} | Ciclo: ${OBJETIVO} | db_engine: ${ENGINE}"
git --no-pager log -1 --oneline
