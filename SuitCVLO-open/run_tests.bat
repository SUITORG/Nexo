@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PY=python"
where python >nul 2>nul || set "PY=py -3"

echo Ejecutando pruebas (modo MOCK, sin internet)...
%PY% -m unittest discover -s tests -t . -v
pause
