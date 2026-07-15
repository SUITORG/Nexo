@echo off
title SuitTest — Contactos CRUD
echo ============================================
echo   SuitTest — Contactos CRUD (SuitOS Core)
echo ============================================
echo.
echo Iniciando servidor en http://localhost:3020
echo.
cd /d "%~dp0"
start http://localhost:3020
node backend/server.js
pause
