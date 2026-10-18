@echo off
title SuitOS Master
cd /d "%~dp0"
set PORT=8137

echo Liberando puerto %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

echo Iniciando servidor estatico (solo local)...
start "SuitOS-Master-server" /min cmd /c "python -m http.server %PORT% --bind 127.0.0.1"

set INTENTOS=0
:esperar
set /a INTENTOS+=1
timeout /t 1 /nobreak >nul
netstat -aon | findstr :%PORT% | findstr LISTENING >nul
if errorlevel 1 (
    if %INTENTOS% lss 10 goto esperar
    echo *** ERROR: el servidor no respondio en el puerto %PORT% ***
    echo *** Verifica que Python este instalado: python --version ***
    pause
    exit /b 1
)

echo Master listo: http://127.0.0.1:%PORT%/MASTER.html
start "" "http://127.0.0.1:%PORT%/MASTER.html"
echo (Para detener el servidor cierra la ventana minimizada "SuitOS-Master-server")
timeout /t 3 >nul
