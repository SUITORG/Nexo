@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY ( where py >nul 2>nul && set "PY=py -3" )
if not defined PY if exist "C:\Program Files\AutoClaw\resources\python\python.exe" set "PY=C:\Program Files\AutoClaw\resources\python\python.exe"

if not defined PY (
  echo No se encontro Python 3. Instala Python 3 o abre la app desde AutoClaw.
  pause
  exit /b 1
)

%PY% -c "import flask, openpyxl, PIL, pillow_heif, gdown" >nul 2>nul
if errorlevel 1 (
  echo Instalando dependencias ^(flask, openpyxl, pillow, pillow-heif, gdown^)...
  %PY% -m pip install flask openpyxl pillow pillow-heif gdown
)

echo Iniciando SuitCVLO-open en http://127.0.0.1:3015 ...
%PY% app.py
pause
