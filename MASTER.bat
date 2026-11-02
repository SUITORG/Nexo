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

rem SuitMarket (sidecar :3020) — solo si NO esta corriendo; nunca lo mata
rem (matarlo perderia las cache del dia y el hilo de alertas post-cierre)
netstat -aon | findstr :3020 | findstr LISTENING >nul
if not errorlevel 1 goto sm_ya
echo Iniciando SuitMarket (sidecar :3020)...
start "SuitMarket-server" /min cmd /c "python SuitMarket\api\server.py"
set /a ESP3020=0
:sm_esperar
set /a ESP3020+=1
timeout /t 1 /nobreak >nul
netstat -aon | findstr :3020 | findstr LISTENING >nul
if not errorlevel 1 goto sm_ok
if %ESP3020% lss 15 goto sm_esperar
echo *** Aviso: SuitMarket (:3020) no respondio - la pestana SuitMarket estara caida ***
goto sm_fin
:sm_ya
echo SuitMarket ya corriendo en :3020
goto sm_fin
:sm_ok
echo SuitMarket listo en :3020
:sm_fin

rem SuitCompromisos - puente local con Google Calendar (:8138)
netstat -aon | findstr :8138 | findstr LISTENING >nul
if not errorlevel 1 goto sc_listo
echo Iniciando SuitCompromisos sync (:8138)...
start "SuitCompromisos-server" /min cmd /c "cd /d %~dp0 && node SuitCompromisos\server.js >> SuitCompromisos\server.log 2>&1"
set /a SC_ESPERA=0
:sc_esperar
set /a SC_ESPERA+=1
timeout /t 1 /nobreak >nul
netstat -aon | findstr :8138 | findstr LISTENING >nul
if not errorlevel 1 goto sc_listo
if %SC_ESPERA% lss 10 goto sc_esperar
echo *** Aviso: SuitCompromisos (:8138) no respondio ***
:sc_listo

rem %RANDOM% rompe la caché del navegador: sin esto Chrome servía un MASTER.html
rem guardado, y al no cargar el nuevo tampoco se aplicaba el cache-busting de los
rem iframes → los módulos (p. ej. SuitMisCtas) se quedaban en una versión vieja.
set STAMP=%RANDOM%%RANDOM%
echo Master listo: http://127.0.0.1:%PORT%/MASTER.html?t=%STAMP%
start "" "http://127.0.0.1:%PORT%/MASTER.html?t=%STAMP%"
echo (Para detenerlos: cierra las ventanas minimizadas "SuitOS-Master-server", "SuitMarket-server" y "SuitCompromisos-server")
timeout /t 3 >nul
