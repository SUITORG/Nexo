@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ============================================================
echo   SuitOrg - SaaS multi-tenant para PYMES
echo   CRM/Leads, POS, Citas, Pedidos, Inventario, Catalogos,
echo   Campanas IA, Videos (ViRe), Chatbot y Cotizaciones
echo   Backend: Google Sheets + Supabase ^| Frontend: JS vanilla
echo ============================================================
echo   [1] Abrir openclaude     - Asistente IA de Claude
echo   [2] Abrir opencode       - Asistente IA de desarrollo
echo   [3] Backup               - Zip comprimido del proyecto
echo   [4] Commit + push        - Subir cambios a GitHub
echo   [5] Diccionario          - Diccionario (MiBDdic)
echo   [6] MoneyPrinterTurbo    - Video corto IA: tema -^> GCSM
echo   [7] Pinokio              - Lanzador de apps IA
echo   [8] Salir                - Cerrar el menu
echo   [9] Ver Brief            - Documentacion del proyecto
echo   [G] Ver GeneralToolsRP   - Herramientas internas
echo   [T] Terminales (CMD, PowerShell, WSL)
echo   [S] Iniciar SuitOrg       - Levantar servidor (3001 + submodulos)
echo ============================================================
choice /c 123456789GTS /n /m "Selecciona una opcion: "

if errorlevel 12 goto :suitorg
if errorlevel 11 goto :menu_terminal
if errorlevel 10 goto :ver_tools
if errorlevel 9 goto :ver_brief
if errorlevel 8 goto :fin
if errorlevel 7 goto :pinokio
if errorlevel 6 goto :mpt
if errorlevel 5 goto :diccionario
if errorlevel 4 goto :commit
if errorlevel 3 goto :backup
if errorlevel 2 goto :menu_opencode
if errorlevel 1 goto :menu_openclaude

:menu_openclaude
cls
echo ============================================================
echo   Abrir openclaude - Selecciona opcion
echo ============================================================
echo   [1] Nueva sesion
echo   [2] Ultima sesion (continue)
echo   [3] Ver sesiones (elegir)
echo   [0] Volver
echo ============================================================
choice /c 1230 /n /m "Selecciona: "
if errorlevel 4 goto :menu
if errorlevel 3 claude -r
if errorlevel 2 claude -c
if errorlevel 1 claude
goto :menu

:menu_opencode
cls
echo ============================================================
echo   Abrir opencode - Selecciona opcion
echo ============================================================
echo   [1] Nueva sesion
echo   [2] Ultima sesion (continue)
echo   [3] Ver sesiones (listar)
echo   [0] Volver
echo ============================================================
choice /c 1230 /n /m "Selecciona: "
if errorlevel 4 goto :menu
if errorlevel 3 goto :opencode_sesiones
if errorlevel 2 opencode -c
if errorlevel 1 opencode
goto :menu

:opencode_sesiones
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0opencode-sessions.ps1"
goto :menu

:menu_terminal
cls
echo ============================================================
echo   Terminales - Selecciona opcion
echo ============================================================
echo   [1] CMD
echo   [2] PowerShell
echo   [3] WSL (Ubuntu)
echo   [0] Volver
echo ============================================================
choice /c 1230 /n /m "Selecciona: "
if errorlevel 4 goto :menu
if errorlevel 3 wsl
if errorlevel 2 powershell
if errorlevel 1 cmd
goto :menu

:ver_brief
cls
echo ============================================================
echo   BRIEF (solo lectura - navega con Enter, Salir con Q)
echo ============================================================
more "%~dp0SuitCampanas\BRIEF.MD"
echo.
pause
goto :menu

:ver_tools
cls
echo ============================================================
echo   GENERALTOOLSRP (solo lectura - navega con Enter, Salir con Q)
echo ============================================================
more "%~dp0GeneralToolsRP.MD"
echo.
pause
goto :menu

:backup
call suitorg-backup.bat
goto :menu

:commit
call suitorg-commit.bat
goto :menu

:mpt
call MoneyPrinterTurbo.bat
goto :menu

:diccionario
call "%~dp0SuitMiDBdic\run.bat"
goto :menu

:pinokio
start "" "C:\Users\rojo-\AppData\Local\Programs\Pinokio\Pinokio.exe"
goto :menu

:suitorg
call start_suitorg.bat
goto :menu

:fin
endlocal
exit /b 0