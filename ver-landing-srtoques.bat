@echo off
title SuitOrg - Ver Landing SRTOQUES
color 0A
cls

echo ===================================================
echo   SuitOrg Server - Landing SRTOQUES
echo ===================================================
echo.

echo [1/3] Verificando procesos existentes en puerto 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo     Matando proceso %%a...
    taskkill /F /PID %%a >nul 2>&1
)
echo     Puerto libre

echo.
echo [2/3] Iniciando servidor...
cd /d "%~dp0"
start "SuitOrg-server" /min cmd /c "node server.js > server.log 2>&1"

echo [3/3] Esperando a que el servidor responda...
set INTENTOS=0
:esperar
set /a INTENTOS+=1
timeout /t 1 /nobreak >nul
netstat -aon | findstr :3001 | findstr LISTENING >nul
if errorlevel 1 (
    if %INTENTOS% lss 15 goto esperar
    echo.
    echo *** ERROR: el servidor no respondio en el puerto 3001 ***
    echo *** Log ^(tambien en server.log^): ***
    echo.
    type server.log 2>nul
    echo.
    pause
    exit /b 1
)

echo.
echo *** SERVIDOR INICIADO EXITOSAMENTE ***
echo *** URL: http://localhost:3001/dist/srtoques.html ***
echo.

set CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" set CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
if not exist "%CHROME%" set CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
if exist "%CHROME%" (
    start "" "%CHROME%" http://localhost:3001/dist/srtoques.html
) else (
    echo     Chrome no encontrado, abriendo con el navegador por defecto...
    start http://localhost:3001/dist/srtoques.html
)
pause >nul
