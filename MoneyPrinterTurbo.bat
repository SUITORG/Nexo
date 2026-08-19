@echo off
title MoneyPrinterTurbo - Launcher
setlocal
set "SERVICE=MoneyPrinterTurbo"
set "APP_DIR=C:\Users\rojo-\Downloads\MoneyPrinterTurbo"
set "API_CMD=.venv\Scripts\python.exe main.py"
set "WEBUI_CMD=webui.bat"
set "API_PORT=8080"
set "WEBUI_PORT=8501"
set "URL=http://127.0.0.1:%WEBUI_PORT%"
set "MAX_WAIT=90"

cls
echo.
echo  ============================================
echo                 MoneyPrinterTurbo
echo  ============================================
echo.

rem 1) Despejar puertos: tumbar cualquier servicio que los ocupe
set "PID="
for /f "usebackq tokens=1" %%p in (`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort %API_PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)"`) do set "PID=%%p"
if defined PID (
  echo  [i] Servicio previo en puerto %API_PORT% ^(PID %PID%^) - terminandolo...
  taskkill /F /PID %PID% >nul 2>&1
  timeout /t 3 /nobreak >nul
) else (
  echo  [i] Puerto %API_PORT% ^(API^) libre.
)

set "PID="
for /f "usebackq tokens=1" %%p in (`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort %WEBUI_PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)"`) do set "PID=%%p"
if defined PID (
  echo  [i] Servicio previo en puerto %WEBUI_PORT% ^(WebUI^) - terminandolo...
  taskkill /F /PID %PID% >nul 2>&1
  timeout /t 3 /nobreak >nul
) else (
  echo  [i] Puerto %WEBUI_PORT% ^(WebUI^) libre.
)

rem 2) Lanzar API y WebUI en ventanas propias
cd /d "%APP_DIR%"
echo  [i] Lanzando API en puerto %API_PORT%...
start "%SERVICE% API" cmd /k "cd /d %APP_DIR% && %API_CMD%"
echo  [i] Lanzando WebUI en puerto %WEBUI_PORT%...
start "%SERVICE% WebUI" cmd /k "cd /d %APP_DIR% && %WEBUI_CMD%"

rem 3) Esperar a que responda la WebUI
set /a tries=0
:waitloop
set /a tries+=1
if %tries% gtr %MAX_WAIT% goto timeoutmsg
powershell -NoProfile -Command "try { Invoke-WebRequest '%URL%/' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 ( timeout /t 1 /nobreak >nul & goto waitloop )

echo.
echo  [OK] %SERVICE% listo: %URL%
start "" %URL%
goto done

:timeoutmsg
echo.
echo  [X] No respondio a tiempo. Revisa las ventanas de %SERVICE%.
goto done

:done
echo.
echo  ============================================
echo    COMO USARLO
echo  ============================================
echo    1. En la web escribe un tema y presiona Generate
echo    2. El guion lo escribe tu Ollama local (qwen3-14b)
echo    3. El video .mp4 se guarda en storage/ del proyecto
echo    4. Para apagar cierra las ventanas de %SERVICE%
echo  ============================================
echo.
endlocal