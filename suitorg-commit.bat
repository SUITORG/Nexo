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
  echo [X] Nada que commitear o error en commit
  goto :end
)

set BRANCH=
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
if "%BRANCH%"=="" goto :end

echo [*] Pusheando a origin/%BRANCH% ...
git push origin "%BRANCH%"

:end
endlocal
pause