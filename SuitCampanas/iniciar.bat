@echo off
title SuitCampanas Server 8000
cd /d "%~dp0"

:: Kill any process using port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

echo Iniciando servidor CampanasAi...
start /min "SuitCampanas" cmd /c "mode con: cols=80 lines=20 & node local-server-node.js & pause"
timeout /t 2 /nobreak >nul
start chrome http://localhost:8000
echo Servidor corriendo en http://localhost:8000
exit
