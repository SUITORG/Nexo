@echo off
title SuitMarket - Launcher
setlocal
set "SERVICE=SuitMarket"
set "APP_DIR=C:\Users\rojo-\Downloads\SuitOrg\SuitMarket"
set "START_CMD=python api\server.py"
set "PORT=3020"
set "URL=http://127.0.0.1:%PORT%"
set "MAX_WAIT=60"

cls
echo.
echo  ============================================
echo    %SERVICE% — Dashboard de Mercado
echo  ============================================
echo.

rem 1) Despejar el puerto: tumbar cualquier servicio que lo ocupe
set "PID="
for /f "usebackq tokens=1" %%p in (`powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)"`) do set "PID=%%p"
if defined PID (
  echo  [i] Servicio previo en puerto %PORT% ^(PID %PID%^) - terminandolo...
  taskkill /F /PID %PID% >nul 2>&1
  timeout /t 3 /nobreak >nul
) else (
  echo  [i] Puerto %PORT% libre.
)

rem 2) Lanzar el servicio
cd /d "%APP_DIR%"
echo  [i] Lanzando %SERVICE%...
start "%SERVICE%" cmd /k "cd /d %APP_DIR% && %START_CMD%"

rem 3) Esperar a que responda
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
echo  [X] No respondio a tiempo. Revisa la ventana de %SERVICE%.
goto done

:done
echo.
echo  ============================================
echo    COMO USARLO
echo  ============================================
echo    1. La pesta^nna se abre sola en http://127.0.0.1:3020
echo    2. Precios: indices/ETFs/BTC/USD-MXN via Twelve Data
echo       gratis si pegaste la key en config.json; si no, Yahoo.
echo    3. Commodities y noticias siempre via Yahoo (server-side).
echo    4. La UI refresca cada 30s pero las fuentes se consultan
echo       cada 10-15 min ^(cach^e local^) — asi no se agotan los
echo       800 creditos/dia del plan gratis.
echo    5. Para cerrar: cierra la ventana de %SERVICE% o vuelve
echo       a ejecutar este bat ^(libera y relanza el puerto^).
echo  ============================================
echo.
endlocal
