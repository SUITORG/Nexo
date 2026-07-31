@echo off
title SuitOrg Server
cd /d "%~dp0"
echo.
echo  ^>^>^> Iniciando SuitOrg Server ^<^<^<
echo.
echo   Puerto: 3001
echo   URL:    http://localhost:3001
echo.
echo   Presiona Ctrl+C para detener
echo.
node server.js
pause
