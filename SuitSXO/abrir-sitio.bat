@echo off
title SuitSXO - Abrir sitio sxo.mx
cd /d "%~dp0"

if "%~1"=="servir" (
  echo Sirviendo en http://localhost:8080 ...
  start "" "http://localhost:8080"
  python -m http.server 8080 --directory "%~dp0sxo.mx"
  exit /b
)

start "" "%~dp0sxo.mx\index.html"

echo.
echo Si se abre una pantalla oscura: haz clic en "Soy mayor de 18".
echo Si no se abrio el navegador, abre manualmente: sxo.mx\index.html
timeout /t 3 >nul