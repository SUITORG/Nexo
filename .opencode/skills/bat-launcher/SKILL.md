# Skill: bat-launcher

## Descripción
Genera o actualiza el `.bat` lanzador del servidor local de un proyecto dentro del monorepo SuitOrg, siguiendo el patrón ya establecido en el repo (`SuitCVLO/iniciar.bat`, `start_suitorg.bat`): banner, mata cualquier instancia previa del servidor antes de levantar una nueva, corre el servidor en su propia ventana de consola chica, espera a que responda de verdad (no un `timeout` a ciegas), y recién entonces abre el sitio en el navegador a tamaño normal.

## Trigger
- "hazme un bat que levante el servidor de [proyecto]"
- "que el bat también abra la página/el sitio"
- "bat lanzador para [proyecto]"
- Cualquier pedido de `.bat`/launcher en un proyecto del monorepo que arranque un servidor local

## Instrucciones

1. **Ubicar el entry point y el puerto real** — `Grep` el `.bat` existente del proyecto (si hay uno) o el `package.json`/`server.js`/`local-server-node.js` para confirmar el comando de arranque exacto y el puerto (`app.listen(PORT, ...)`). No asumir el puerto — verificarlo en el código.
2. **Adaptar la plantilla de abajo**, reemplazando `<NOMBRE>`, `<PUERTO>` y `<COMANDO>`. No inventar variantes nuevas de banner/lógica — reusar la plantilla tal cual para que todos los `.bat` del monorepo se vean y funcionen igual.
3. **Verificar de verdad, no solo `node --check`** (esto es un `.bat`, no hay syntax-checker): correr el servidor real (`node <comando>` en foreground o `run_in_background`) y confirmar con `curl`/`netstat` que responde en el puerto esperado antes de darlo por bueno. Limpiar el proceso de prueba al terminar (`taskkill /F /PID`) para no dejar nada corriendo que el usuario no pidió.
4. Si el proyecto ya tiene un `.bat` lanzador **duplicado o con ruta hardcodeada** (ej. dos `.bat` que hacen lo mismo, o uno con `cd /d "C:\ruta\vieja"` en vez de `%~dp0`), señalarlo al usuario en vez de borrarlo silenciosamente — puede ser trabajo en curso.

## Plantilla

```bat
@echo off
title <NOMBRE> — Launcher
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║            <NOMBRE> — Servidor         ║
echo  ╚═══════════════════════════════════════╝
echo.

set PORT=<PUERTO>
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

echo  [1/3] Iniciando servidor en ventana propia (chica)...
start "<NOMBRE> Server" cmd /k "mode con: cols=100 lines=25 && title <NOMBRE> Server && <COMANDO>"

echo  [2/3] Esperando a que el servidor responda...
:waitloop
set /a RETRIES+=1
if %RETRIES% gtr %MAX_RETRIES% (
    echo  [!] El servidor no respondio a tiempo.
    echo      Revisa la ventana "<NOMBRE> Server" por errores.
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
echo   Servidor: ventana "<NOMBRE> Server" (chica)
echo   Cierra esa ventana (o Ctrl+C ahi) para detenerlo.
echo  ─────────────────────────────────────────
echo.
```

## Reglas
- La ventana chica (`mode con: cols=100 lines=25`) es **solo** para la ventana del servidor — el navegador se abre siempre a su tamaño normal (`start "" http://...`, sin flags de tamaño).
- Esperar disponibilidad real por `netstat`/puerto en `LISTENING`, nunca un `timeout` fijo sin verificar — evita abrir el navegador antes de que el servidor esté listo.
- El kill-loop solo mata procesos escuchando en el puerto exacto del proyecto — nunca `taskkill` por nombre de imagen (`node.exe`) a secas, mataría procesos node de otros proyectos/sesiones.
- `cd /d "%~dp0"` siempre (ruta relativa al propio `.bat`), nunca ruta absoluta hardcodeada — el `.bat` debe funcionar si el repo se mueve o clona en otra máquina.
- Reusar exactamente esta plantilla entre proyectos — si un proyecto necesita algo distinto (WSL, un health-check endpoint propio en vez de solo el puerto, múltiples servicios), extender la plantilla puntualmente, no reescribirla desde cero.

## Referencias en este repo
- `SuitCVLO/iniciar.bat` — versión con WSL + health-check por `curl` a un endpoint propio (para servidores que sí exponen `/health`).
- `start_suitorg.bat` — versión de esta plantilla, sin WSL, health-check por puerto vía `netstat` (para servidores sin endpoint de salud dedicado).
