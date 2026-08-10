@echo off
title SuitComfy - Inicio
echo [1/2] Iniciando ComfyUI (CPU, puerto 8188)...
start "ComfyUI Server" cmd /k call "C:\Users\rojo-\AppData\Local\Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\.ci\windows_nvidia_base_files\run_cpu.bat"
echo [2/2] Abriendo sesion opencode (SuitOrg)...
timeout /t 4 /nobreak >nul
cd /d "C:\Users\rojo-\Downloads\SuitOrg"
opencode
