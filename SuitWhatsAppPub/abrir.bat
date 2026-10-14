@echo off
title SuitWhatsAppPub — Launcher
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║   SuitWhatsAppPub — Servidor            ║
echo  ╚═══════════════════════════════════════╝
echo.

set PORT=3019
set KILLWAIT=0
set MAX_KILLWAIT=15
set RETRIES=0
set MAX_RETRIES=15

echo  [0/3] Deteniendo servidor previo (puerto %PORT%)...
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
start "SuitWhatsAppPub Server" cmd /k "mode con: cols=100 lines=25 && title SuitWhatsAppPub Server && echo ************************************* && echo   LEVANTADO: %LEVANTADO% && echo ************************************* && node index.js"

echo  [2/3] Esperando a que el servidor responda...
:waitloop
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El servidor no respondio a tiempo.
    echo      Revisa la ventana "SuitWhatsAppPub Server" por errores.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto waitloop

echo  [3/3] Servidor listo. Abriendo el panel...
start "" http://localhost:%PORT%
echo.
echo  ─────────────────────────────────────────
echo   Panel:    http://localhost:%PORT%
echo   Servidor: ventana "SuitWhatsAppPub Server" (chica)
echo   *************************************
echo     LEVANTADO: %LEVANTADO%
echo   *************************************
echo   Cierra esa ventana (o Ctrl+C ahi) para detenerlo.
echo  ─────────────────────────────────────────
echo.
ping -n 4 127.0.0.1 >nul
