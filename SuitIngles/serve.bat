@echo off
echo ========================================
echo   SuitIngles - Servidor Local
echo ========================================
echo.
echo Abriendo navegador...
start http://localhost:3000
echo.
echo Servidor corriendo en http://localhost:3000
echo Presiona Ctrl+C para detener.
echo.
cd /d "%~dp0dist"
npx serve -l 3000 -s
