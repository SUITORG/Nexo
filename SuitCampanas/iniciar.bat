@echo off
title SuitCampanas Server 8000
cd /d "%~dp0"

:: Kill any process using port 8000 (via PowerShell — netstat/findstr/tokens
:: fallaba en silencio con >nul 2>&1 y dejaba procesos viejos vivos)
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul

echo Iniciando servidor CampanasAi...
start /min "SuitCampanas" cmd /c "mode con: cols=80 lines=20 & node local-server-node.js & pause"
timeout /t 2 /nobreak >nul
start chrome http://localhost:8000
echo Servidor corriendo en http://localhost:8000
exit
