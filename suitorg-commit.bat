@echo off
setlocal
cd /d "%~dp0"

for /f %%i in ('powershell -NoProfile -Command "(Get-Date).ToString('yyMMdd-HHmm')"') do set TS=%%i

REM Tipo de commit: %1 (default "chore")
set TIPO=%1
if "%TIPO%"=="" set TIPO=chore

REM Descripcion: %2 (default "backup")
set DESC=%2
if "%DESC%"=="" set DESC=backup

git add -A
git commit -m "%TIPO%: %DESC% (%date% %time%)"
if errorlevel 1 (
  echo [i] Nada nuevo que commitear ^(puede que ya estuviera commiteado^) - se intenta subir igual lo pendiente...
)

set BRANCH=
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
if "%BRANCH%"=="" goto :end

echo [*] Pusheando a origin/%BRANCH% ...
git push origin "%BRANCH%"

:end
endlocal
pause