#!/bin/bash
cd /mnt/c/Users/rojo-/Downloads/suitorg/SuitCVLO
source .venv/bin/activate
python -m uvicorn api.main:app --host 0.0.0.0 --port 3011 > /tmp/suit.log 2>&1 &
echo "PID=$!"
