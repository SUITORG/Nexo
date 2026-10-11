@echo off
title IdeasSaaS - Panel de corrida
cd /d "%~dp0"
netstat -ano | findstr :8099 | findstr LISTENING >nul
if %errorlevel%==0 (
  echo Puerto 8099 ya activo — abriendo navegador...
) else (
  echo Levantando panel IdeasSaaS en puerto 8099...
  start "" /min node serve-panel.js
  ping -n 3 127.0.0.1 >nul
)
start "" http://localhost:8099/panel.html
echo Panel abierto. Deja esta ventana abierta (el servidor vive aqui).
pause
