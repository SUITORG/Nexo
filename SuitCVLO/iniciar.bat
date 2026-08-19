@echo off
title SuitCVLO — Servidor
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║      SuitCVLO — Servidor v0.4        ║
echo  ║  Computer Vision Look Once — OOH     ║
echo  ╚═══════════════════════════════════════╝
echo.

set WSL_PATH=/mnt/c/Users/rojo-/Downloads/suitorg/SuitCVLO
set RETRIES=0
set MAX_RETRIES=15
set KILLWAIT=0
set MAX_KILLWAIT=15

echo  [0/3] Deteniendo cualquier servidor SuitCVLO previo (puerto 3011)...
wsl bash -c "pkill -f 'python -m api.main' 2>/dev/null; exit 0"
if errorlevel 1 goto started
:killwait
set /a KILLWAIT+=1
if %KILLWAIT% gtr %MAX_KILLWAIT% goto started
netstat -ano | findstr /r /c:":3011" | findstr /i "LISTENING" >nul 2>&1
if errorlevel 1 goto killdone
timeout /t 1 /nobreak >nul
goto killwait
:killdone
echo        Servidor anterior detenido y ventana cerrada.

:started
echo  [1/3] Iniciando servidor...
echo        (cargando modelo YOLO, tarda ~20s la primera vez)
start "SuitCVLO Server" wsl bash -c "cd %WSL_PATH% && source .venv/bin/activate && python -m api.main"

echo  [2/3] Esperando respuesta del servidor...
:waitloop
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El servidor no respondio a tiempo.
    echo      Revisa que el puerto 3011 no este ocupado.
    echo      O abre http://localhost:3011 manualmente.
    pause
    exit /b 1
)
timeout /t 2 /nobreak >nul
curl.exe -s http://localhost:3011/health >nul 2>&1
if errorlevel 1 goto waitloop

:open
echo  [3/3] Servidor listo. Abriendo navegador...
start http://localhost:3011
echo.
echo  ─────────────────────────────────────────
echo   Servidor activo en: http://localhost:3011
echo   Arrastra un .zip o foto en la pagina.
echo   Cierra esta ventana para detener todo.
echo  ─────────────────────────────────────────
echo.
