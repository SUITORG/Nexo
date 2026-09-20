@echo off
title SuitServiHogar Dev Server
echo ========================================
echo  SuitServiHogar - Iniciando servidor...
echo ========================================

:: Kill any existing process on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Terminando proceso PID: %%a en puerto 3000...
    taskkill /F /PID %%a >nul 2>&1
)

:: Kill any existing process on port 3010
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3010 ^| findstr LISTENING') do (
    echo Terminando proceso PID: %%a en puerto 3010...
    taskkill /F /PID %%a >nul 2>&1
)

:: Start Stripe server in background
echo.
echo Iniciando Stripe server en http://localhost:3010
echo.
start /b npx tsx server.js

:: Start dev server in background
echo.
echo Iniciando Vite dev server en http://localhost:3000
echo.
start /b npm run dev

:: Wait for server to be ready
echo Esperando a que el servidor este listo...
set /a tries=0
:waitloop
set /a tries+=1
if %tries% gtr 30 (
    echo Timeout - el servidor no respondio. Abriendo de todos modos...
    goto :open
)
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if errorlevel 1 (
    timeout /t 1 >nul
    goto :waitloop
)

:open
echo Servidor listo. Abriendo navegador...
start http://localhost:3000
