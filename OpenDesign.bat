@echo off
chcp 65001 >nul
title Open Design - Servidor local
set "APP=C:\Users\rojo-\AppData\Local\Programs\Open Design\Open Design.exe"

tasklist /FI "IMAGENAME eq Open Design.exe" 2>nul | find /I "Open Design.exe" >nul
if not errorlevel 1 (
    echo [OK] Open Design ya esta corriendo.
) else (
    echo [OK] Iniciando Open Design...
    start "" "%APP%"
)

echo Esperando que levante el servidor local (puerto 7456)...
timeout /t 10 >nul
start "" http://localhost:7456