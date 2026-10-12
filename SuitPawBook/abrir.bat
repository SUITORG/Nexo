@echo off
title SuitPawBook — Launcher
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║        SuitPawBook — Servidor          ║
echo  ╚═══════════════════════════════════════╝
echo.

set PORT=3018
set KILLWAIT=0
set MAX_KILLWAIT=15
set RETRIES=0
set MAX_RETRIES=15

echo  [0/3] Deteniendo cualquier servidor previo (puerto %PORT%)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
:killwait
set /a KILLWAIT+=1
if %KILLWAIT% gtr %MAX_KILLWAIT% goto killdone
netstat -aon | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto killdone
timeout /t 1 /nobreak >nul
goto killwait
:killdone
echo        Listo.
echo.

set LEVANTADO=%date% %time%

echo  [1/3] Iniciando servidor en ventana propia (chica)...
start "SuitPawBook Server" cmd /k "mode con: cols=100 lines=25 && title SuitPawBook Server && echo ************************************* && echo   LEVANTADO: %LEVANTADO% && echo ************************************* && node index.js"

echo  [2/3] Esperando a que el servidor responda...
:waitloop
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El servidor no respondio a tiempo.
    echo      Revisa la ventana "SuitPawBook Server" por errores.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto waitloop

echo  [3/3] Servidor listo. Abriendo el sitio en el navegador...
start "" http://localhost:%PORT%
echo.
echo  ─────────────────────────────────────────
echo   Sitio:    http://localhost:%PORT%
echo   Servidor: ventana "SuitPawBook Server" (chica)
echo   *************************************
echo     LEVANTADO: %LEVANTADO%
echo   *************************************
echo   Cierra esa ventana (o Ctrl+C ahi) para detenerlo.
echo  ─────────────────────────────────────────
echo.
ping -n 4 127.0.0.1 >nul
