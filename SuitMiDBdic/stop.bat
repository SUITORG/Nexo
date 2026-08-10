@echo off
title MiBDdic - Detener Servidor
color 0C
cls

echo.
echo  ╔═══════════════════════════════════════════════════════════════╗
echo  ║  DETENIENDO SERVIDOR MiBDdic                                 ║
echo  ╚═══════════════════════════════════════════════════════════════╝
echo.

echo Buscando procesos en puerto 3013...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3013 ^| findstr LISTENING') do (
    echo     Deteniendo proceso %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  ✓ Servidor detenido correctamente.
echo.
pause