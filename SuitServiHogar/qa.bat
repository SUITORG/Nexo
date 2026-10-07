@echo off
title SuitServiHogar - Modo Prueba (3 roles)
cd /d "%~dp0"
color 0b
cls

echo  ========================================
echo    SuitServiHogar - MODO PRUEBA
echo    3 ventanas: cliente / tecnico / admin
echo  ========================================
echo.

set FRONTPORT=3000
set BACKPORT=3010
set ALL_PORTS=3000 3010
set RETRIES=0
set MAX_RETRIES=60

echo  [0/4] Deteniendo instancias previas (puertos %ALL_PORTS%)...
for %%p in (%ALL_PORTS%) do (
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
)
set KILLWAIT=0
:killwait
set /a KILLWAIT+=1
if %KILLWAIT% gtr 15 goto killdone
set STILLUP=0
for %%p in (%ALL_PORTS%) do (
    netstat -aon | findstr ":%%p" | findstr "LISTENING" >nul 2>&1
    if not errorlevel 1 set STILLUP=1
)
if %STILLUP%==0 goto killdone
timeout /t 1 /nobreak >nul
goto killwait
:killdone
echo        Listo.
echo.

set LEVANTADO=%date% %time%

echo  [1/4] Levantando backend en ventana propia (chica)...
start "ServiHogar Backend 3010" cmd /k "mode con: cols=100 lines=25 && title ServiHogar Backend 3010 && echo ************************************* && echo   LEVANTADO: %LEVANTADO% && echo ************************************* && npx tsx server.js"

echo  [2/4] Esperando backend en puerto %BACKPORT%...
set RETRIES=0
:waitback
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El backend no respondio a tiempo. Revisa la ventana "ServiHogar Backend 3010".
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":%BACKPORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto waitback

echo  [3/4] Levantando frontend en ventana propia (chica)...
start "ServiHogar Frontend 3000" cmd /k "mode con: cols=100 lines=25 && title ServiHogar Frontend 3000 && echo ************************************* && echo   LEVANTADO: %LEVANTADO% && echo ************************************* && npm run dev"

echo  [4/4] Esperando frontend en puerto %FRONTPORT%...
set RETRIES=0
:waitfront
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El frontend no respondio a tiempo. Revisa la ventana "ServiHogar Frontend 3000".
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":%FRONTPORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto waitfront

echo  Servidores listos. Abriendo 3 ventanas de prueba...
set "DEVFLAGS=http://localhost:3000/?devMode=true&devMockStripe=true&devMockExchangeRate=true"

set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER_EXE%" set "BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER_EXE%" set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%BROWSER_EXE%" set "BROWSER_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist "%BROWSER_EXE%" (
    REM --new-window: cada rol en su propia ventana nueva, nunca una pestana
    REM en la ventana del navegador que ya tienes abierta trabajando.
    start "" "%BROWSER_EXE%" --new-window "%DEVFLAGS%&devAutoLogin=client"
    start "" "%BROWSER_EXE%" --new-window "%DEVFLAGS%&devAutoLogin=technician"
    start "" "%BROWSER_EXE%" --new-window "%DEVFLAGS%&devAutoLogin=admin"
) else (
    echo  [!] No se encontro Chrome/Edge en rutas estandar - abriendo con el navegador por defecto.
    echo      Puede abrir como pestanas en una ventana existente.
    start "" "%DEVFLAGS%&devAutoLogin=client"
    start "" "%DEVFLAGS%&devAutoLogin=technician"
    start "" "%DEVFLAGS%&devAutoLogin=admin"
)

echo.
echo  ========================================
echo   Ventanas abiertas (rol via URL param):
echo     1) Cliente     devAutoLogin=client
echo     2) Tecnico     devAutoLogin=technician
echo     3) Admin       devAutoLogin=admin
echo   Backend:  ventana "ServiHogar Backend 3010" (chica)
echo   Frontend: ventana "ServiHogar Frontend 3000" (chica)
echo   *************************************
echo     LEVANTADO: %LEVANTADO%
echo   *************************************
echo   Cierra esas ventanas (o Ctrl+C ahi)
echo   para detener los servidores.
echo  ========================================
echo.
ping -n 4 127.0.0.1 >nul
