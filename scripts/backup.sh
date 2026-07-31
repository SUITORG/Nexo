#!/bin/bash
cd /mnt/c/Users/rojo-/Downloads/suitorg
datestr=$(date +%y%m%d)
zip -r "../SuitOrg${datestr}.zip" . \
  -x ".git/*" \
  -x "*/node_modules/*" \
  -x ".venv/*" \
  -x "*.zip" \
  -x "__pycache__/*" \
  -x "*.pyc" \
  -x ".wwebjs_auth/*" \
  -x ".playwright-mcp/*" \
  -x "SuitCVLO/__pycache__/*" \
  -x "SuitCVLO/data/*" \
  -x "SuitCVLO/output/*" \
  -x "SuitCVLO/uploads/*" \
  -x "*.png" \
  -x "*.jpg" \
  -x "*.jpeg" \
  -x "*.mp4" \
  -x "*.pdf" \
  -x "media/*" \
  -x "SuitCVLO/e*.png" \
  -x "SuitVidGenRemotion/node_modules/*"
echo "Backup created: ../SuitOrg${datestr}.zip"
