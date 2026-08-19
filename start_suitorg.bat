@echo off
title SuitOrg — Launcher
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║            SuitOrg — Servidor          ║
echo  ║   Orquestacion de agentes + SSG        ║
echo  ╚═══════════════════════════════════════╝
echo.

set PORT=3001
rem server.js no solo escucha en 3001: al arrancar levanta ademas los
rem submodulos SuitAI(3010)/PedidoExpress(3005)/Pos(3006)/Productos(3007)/
rem Inventarios(3008)/Bodega(3009)/citas+Reservaciones(3002) como parte del
rem mismo proceso. Si cualquiera de esos puertos quedo ocupado por una
rem corrida anterior no cerrada bien, node revienta al arrancar (EADDRINUSE)
rem y el sitio nunca llega a abrir -- hay que limpiar los 8, no solo el 3001.
set ALL_PORTS=3001 3002 3005 3006 3007 3008 3009 3010
set RETRIES=0
set MAX_RETRIES=15

echo  [0/3] Deteniendo cualquier instancia previa de SuitOrg (puertos %ALL_PORTS%)...
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

echo  [1/3] Iniciando servidor en ventana propia (chica)...
rem set PORT= limpia la variable heredada de la terminal que lanzo este bat.
rem server.js Y todos sus submodulos (SuitAI/SuitPedidoExpress/SuitPos/...)
rem leen la MISMA variable PORT, cada uno con su propio default distinto
rem (3001/3010/3005/...) -- si PORT ya viene seteada a algo (ej. de una
rem prueba manual anterior en esa terminal), TODOS intentan usar ese mismo
rem valor y chocan entre si al arrancar. Sin la variable, cada uno cae a su
rem propio puerto correcto.
start "SuitOrg Server" cmd /k "mode con: cols=100 lines=25 && title SuitOrg Server && set PORT=&& node server.js"

echo  [2/3] Esperando a que el servidor responda...
:waitloop
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El servidor no respondio a tiempo.
    echo      Revisa la ventana "SuitOrg Server" por errores.
    pause
    exit /b 1
)
timeout /t 1 /nobreak >nul
netstat -aon | findstr ":%PORT%" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 goto waitloop

echo  [3/3] Servidor listo. Abriendo el sitio en el navegador...
start "" http://localhost:%PORT%
echo.
echo  ═══════════════════════════════════════════
echo   CÓMO USARLO
echo  ═══════════════════════════════════════════
echo   1. Sitio:    http://localhost:%PORT%
echo      El servidor abre en la ventana "SuitOrg Server" (chica).
echo   2. Para DETENERLO: cierra esa ventana o presiona Ctrl+C en ella.
echo   3. Accesos rápidos:
echo      - #orbit          Hub de empresas
echo      - #home           Inicio del inquilino activo
echo      - #pos / #staff-pos   Punto de venta (requiere modo flag POS)
echo      - #leads          Bandeja de leads
echo      - #reservations   Reservaciones (requiere usa_reservaciones)
echo   4. Submodulos que arrancan junto con server.js (mismo proceso):
echo      citas(3002) PedidoExpress(3005) Pos(3006) Productos(3007)
echo      Inventarios(3008) Bodega(3009) SuitAI(3010).
echo   5. Si algo no responde, revisa la ventana "SuitOrg Server" por errores.
echo  ═══════════════════════════════════════════
echo.
pause
