@echo off
title TaskFlow — Gestor de Tareas
echo ============================================
echo   TaskFlow — Gestor de Tareas (SuitOS Core)
echo ============================================
echo.
echo Iniciando servidor en http://localhost:3030
echo.
cd /d "%~dp0"
start http://localhost:3030
node backend/server.js
pause
