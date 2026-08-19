@echo off
title SuitIngles - Servidor local
cd /d "%~dp0"

echo ============================================
echo   SuitIngles - Servidor local
echo ============================================
echo.
echo Iniciando servidor con PowerShell...
echo (no necesita Node ni ningun programa adicional)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"

pause
