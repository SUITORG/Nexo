@echo off
title SuitCampanas Server 8000
cd /d "%~dp0"
echo Iniciando servidor CampanasAi...
start "SuitCampanas" cmd /c "node local-server-node.js & pause"
timeout /t 2 /nobreak >nul
start chrome http://localhost:8000
echo Servidor corriendo en http://localhost:8000
