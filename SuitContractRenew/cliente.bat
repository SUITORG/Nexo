@echo off
title ContractRenew — Panel del taller
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║   ContractRenew — Tu panel             ║
echo  ╚═══════════════════════════════════════╝
echo.

set PORT=3017
set KILLWAIT=0
set MAX_KILLWAIT=15
set RETRIES=0
set MAX_RETRIES=15

echo  [0/3] Verificando servidor (puerto %PORT%)...
netstat -aon | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto waitdone

echo        Iniciando servidor...
set LEVANTADO=%date% %time%
start "ContractRenew Server" cmd /k "mode con: cols=100 lines=25 && title ContractRenew Server && echo ************************************* && echo   LEVANTADO: %LEVANTADO% && echo ************************************* && node index.js"

:waitloop
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El servidor no respondio a tiempo.
    echo      Revisa la ventana "ContractRenew Server" por errores.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto waitloop

:waitdone
echo  [1/3] Abriendo tu panel...
start "" http://localhost:%PORT%/app
echo.
echo  ─────────────────────────────────────────
echo   Tu panel:  http://localhost:%PORT%/app
echo   (Entrar con tu PIN de 6 dígitos)
echo  ─────────────────────────────────────────
echo.
ping -n 3 127.0.0.1 >nul
