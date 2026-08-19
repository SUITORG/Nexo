@echo off
title SuitSXO - Abrir sitio sxo.mx-v2
cd /d "%~dp0"

if "%~1"=="servir" (
  echo Sirviendo en http://localhost:8081 ...
  start "" "http://localhost:8081"
  python -m http.server 8081 --directory "%~dp0sxo.mx-v2"
  exit /b
)

start "" "%~dp0sxo.mx-v2\index.html"

echo.
echo Si se abre una pantalla oscura: haz clic en "Soy mayor de 18".
echo Si no se abrio el navegador, abre manualmente: sxo.mx-v2\index.html
timeout /t 3 >nul
