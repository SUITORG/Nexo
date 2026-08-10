@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ========================================
echo   SuitOrg - Menu de mantenimiento
echo ========================================
echo   [1] Backup (zip SuitOrgYYMMDD.zip)
echo   [2] Commit + push a GitHub
echo   [3] Abrir opencode
echo   [0] Salir
echo ========================================
choice /c 1230 /n /m "Selecciona una opcion: "

if errorlevel 4 goto :fin
if errorlevel 3 goto :opencode
if errorlevel 2 goto :commit
if errorlevel 1 goto :backup

:backup
call suitorg-backup.bat
goto :menu

:commit
call suitorg-commit.bat
goto :menu

:opencode
opencode
goto :menu

:fin
endlocal
exit /b 0