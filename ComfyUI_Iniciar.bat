@echo off
title SuitComfy - Inicio
echo [1/2] Iniciando ComfyUI (Comfy Desktop)...
start "" "C:\Users\rojo-\AppData\Local\Programs\ComfyUI\ComfyUI.exe"
echo [2/2] Abriendo sesion opencode (SuitOrg)...
timeout /t 4 /nobreak >nul
cd /d "C:\Users\rojo-\Downloads\SuitOrg"
opencode
