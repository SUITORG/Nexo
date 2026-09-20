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
echo   [3] Tools SuitOrg        - Backup / Commit + push
echo   [4] Sistemas             - Dicc SuitOrg Campanas Board
echo   [5] MoneyPrinterTurbo    - Video corto IA: tema -^> GCSM
echo   [6] Pinokio              - Lanzador de apps IA
echo   [7] Salir                - Cerrar el menu
echo   [D] Ver documentos       - Brief / Listado / Docs IA
echo   [T] Terminales           - CMD, PS, WSL, Git W
echo   [A] Agentes IA          - openclaude, opencode, hermes, openclaw, pi
echo   [F] Freebuff             - Agente de codificacion gratis
echo   [L] Tools IA Local       - OmniRoute, MiroFish, Ask HF, ComfyUI
echo   [S] SaaS Factory         - saas-factory / saas-factory-oc (admin)
echo ============================================================
choice /c 1234567DTAFLS /n /m "Selecciona una opcion: "

if errorlevel 13 goto :menu_saas
if errorlevel 12 goto :tools_ia_local
if errorlevel 11 goto :freebuff
if errorlevel 10 goto :menu_agentes
if errorlevel 9 goto :menu_terminal
if errorlevel 8 goto :ver_documentos
if errorlevel 7 goto :fin
if errorlevel 6 goto :pinokio
if errorlevel 5 goto :mpt
if errorlevel 4 goto :sistemas
if errorlevel 3 goto :tools_suitorg
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
echo   [4] Consulta (limpio, sin MCPs)
echo   [0] Volver
echo ============================================================
choice /c 12340 /n /m "Selecciona: "
if errorlevel 5 goto :menu
if errorlevel 4 goto :opencode_consulta
if errorlevel 3 goto :opencode_sesiones
if errorlevel 2 opencode -c
if errorlevel 1 opencode
goto :menu

:opencode_sesiones
cls
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0opencode-sessions.ps1"
goto :menu

:opencode_consulta
cls
pushd "C:\Users\rojo-\Downloads\SuitConsulta" || (echo No existe SuitConsulta & pause & goto :menu)
opencode
popd
goto :menu

:menu_agentes
cls
echo ============================================================
echo   Agentes IA - Selecciona agente
echo ============================================================
echo   [1] openclaude     - Asistente IA de Claude
echo   [2] opencode       - Asistente IA de desarrollo
echo   [3] hermes         - Hermes Agent (Nous Research)
echo   [4] openclaw       - OpenClaw (asistente personal)
echo   [5] pi             - pi + Qwen3.6 35B (Ollama local)
echo   [0] Volver
echo ============================================================
choice /c 123450 /n /m "Selecciona: "
if errorlevel 6 goto :menu
if errorlevel 5 goto :launch_pi
if errorlevel 4 goto :launch_openclaw
if errorlevel 3 goto :launch_hermes
if errorlevel 2 goto :menu_opencode
if errorlevel 1 goto :menu_openclaude
goto :menu

:launch_pi
cls
echo ============================================================
echo   pi + Qwen3.6 35B (Ollama local) - Iniciando...
echo ============================================================
pi --provider ollama --model qwen36-uncensored-32k --no-skills
goto :menu

:launch_hermes
cls
echo ============================================================
echo   Hermes Agent - Iniciando...
echo ============================================================
set "HERMES_HOME=C:\Users\rojo-\AppData\Local\hermes"
set "PATH=%HERMES_HOME%\bin;%PATH%"
hermes
goto :menu

:launch_openclaw
cls
echo ============================================================
echo   OpenClaw - Abriendo terminal (TUI)...
echo ============================================================
start "OpenClaw TUI" cmd /k "set PATH=C:\Users\rojo-\AppData\Roaming\npm;C:\Users\rojo-\AppData\Roaming\fnm\node-versions\v24.19.0\installation;%PATH% && title OpenClaw TUI && openclaw tui --local"
goto :menu

:menu_saas
cls
echo ============================================================
echo   SaaS Factory - Selecciona opcion (PowerShell admin)
echo ============================================================
echo   [1] saas-factory     - Claude Code en saas-factory
echo   [2] saas-factory-oc  - opencode en saas-factory
echo   [0] Volver
echo ============================================================
choice /c 120 /n /m "Selecciona: "
if errorlevel 3 goto :menu
if errorlevel 2 goto :saas_factory_oc
if errorlevel 1 goto :saas_factory
goto :menu

:saas_factory
powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit','-Command','saas-factory'"
goto :menu

:saas_factory_oc
powershell -NoProfile -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoExit','-Command','saas-factory-oc'"
goto :menu

:menu_terminal
cls
echo ============================================================
echo   Terminales - Selecciona opcion
echo ============================================================
echo   [1] CMD
echo   [2] PowerShell
echo   [3] WSL (Ubuntu)
echo   [4] Git Bash
echo   [0] Volver
echo ============================================================
choice /c 12340 /n /m "Selecciona: "
if errorlevel 5 goto :menu
if errorlevel 4 start "" "C:\Program Files\Git\git-bash.exe"
if errorlevel 3 wsl
if errorlevel 2 powershell
if errorlevel 1 cmd
goto :menu

:ver_documentos
cls
echo ============================================================
echo   Ver documentos - Selecciona opcion
echo ============================================================
echo   [1] Brief
echo   [2] docs/OLLAMA_INTEGRACION.md
echo   [3] SuitAI/README.md
echo   [4] docs/ (carpeta completa)
echo   [5] Listado Skills/MCP/Agentes
echo   [0] Volver
echo ============================================================
choice /c 123450 /n /m "Selecciona: "
if errorlevel 6 goto :menu
if errorlevel 5 goto :ver_listado_capacidades
if errorlevel 4 goto :open_docs_folder
if errorlevel 3 goto :read_suitai_readme
if errorlevel 2 goto :read_ollama_doc
if errorlevel 1 goto :ver_brief
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

:ver_listado_capacidades
cls
echo ============================================================
echo   LISTADO SKILLS/MCP/AGENTES (solo lectura - Enter/Q)
echo ============================================================
more "%~dp0SKILLS-MCP-AGENTS-LISTADO.txt"
echo.
pause
goto :menu

:tools_suitorg
cls
echo ============================================================
echo   Tools SuitOrg - Selecciona opcion
echo ============================================================
echo   [1] Backup              - Zip comprimido del proyecto
echo   [2] Commit + push       - Subir cambios a GitHub
echo   [3] Virus Scan          - Windows Defender offline (REINICIA)
echo   [4] System Backup       - Imagen de sistema en disco externo
echo   [0] Volver
echo ============================================================
choice /c 12340 /n /m "Selecciona: "
if errorlevel 5 goto :menu
if errorlevel 4 goto :system_backup
if errorlevel 3 goto :virus_scan
if errorlevel 2 goto :commit
if errorlevel 1 goto :backup
goto :menu

:backup
call suitorg-backup.bat
goto :menu

:commit
call suitorg-commit.bat
goto :menu

:virus_scan
:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo   Requiere Administrador.
    echo   Click derecho en el .bat -^> Ejecutar como administrador
    echo.
    pause
    goto :menu
)
cls
echo ============================================================
echo   Windows Defender - Escaneo Offline
echo ============================================================
echo.
echo   ATENCION: Este comando reiniciara tu computadora
echo   para escanear malware fuera de Windows.
echo.
echo   Guarda todo tu trabajo antes de continuar.
echo.
echo   El escaneo tarda ~15-30 min y se ejecuta
echo   antes de que Windows cargue completamente.
echo.
choice /c SN /n /m "Continuar? (S/N): "
if errorlevel 2 goto :menu
echo.
echo   Iniciando escaneo offline...
echo   La computadora se reiniciara en 10 segundos...
echo   Presiona Ctrl+C para cancelar.
timeout /t 10
Start-MpWDOScan
goto :menu

:system_backup
:: Check admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo   Requiere Administrador.
    echo   Click derecho en el .bat -^> Ejecutar como administrador
    echo.
    pause
    goto :menu
)
cls
echo ============================================================
echo   Windows System Backup - Imagen de Sistema
echo ============================================================
echo.
echo   Crea una imagen completa del disco C en otro disco.
echo   Selecciona la unidad de destino (E:, F:, etc.)
echo.
echo   NOTA: El disco destino debe ser NTFS (no FAT32/exFAT).
echo.
echo   Unidades disponibles:
echo.
wmic logicaldisk get deviceid,volumename,filesystem,size,freespace 2>nul
echo.
set /p "backup_dest=Unidad de destino (ej: E): "
if "%backup_dest%"=="" goto :menu
if not "%backup_dest:~-1%"==":" set "backup_dest=%backup_dest%:"
echo.
:: Check NTFS format
for /f "tokens=2 delims==" %%i in ('wmic logicaldisk where "DeviceID='%backup_dest%'" get FileSystem /value 2^>nul') do set "fs=%%i"
if /i not "%fs%"=="NTFS" (
    echo   [ERROR] El disco %backup_dest% no es NTFS.
    echo   Formato detectado: %fs%
    echo.
    echo   wbadmin requiere NTFS para imagenes de sistema.
    echo   Formatea el disco a NTFS o usa otro disco.
    echo.
    pause
    goto :menu
)
echo   Destino: %backup_dest%\
echo   Origen:  C: (disco del sistema + critical)
echo.
echo   ADVERTENCIA: Se borraran copias anteriores de WindowsImageBackup
echo   en %backup_dest%\ si existen.
echo.
choice /c SN /n /m "Continuar con backup? (S/N): "
if errorlevel 2 goto :menu
echo.
echo   Iniciando backup de imagen de sistema...
echo   Esto puede tardar 30-60 min segun el disco.
echo.
wbadmin start backup -backupTarget:"%backup_dest%\" -include:C: -allCritical -quiet
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Backup fallo. Verifica:
    echo   - La unidad %backup_dest% existe y tiene espacio
    echo   - Ejecutar como Administrador
)
echo.
pause
goto :menu

:mpt
call MoneyPrinterTurbo.bat
goto :menu

:sistemas
cls
echo ============================================================
echo   Sistemas - Selecciona opcion
echo ============================================================
echo   [1] Diccionario         - Diccionario (MiBDdic)
echo   [2] Iniciar SuitOrg     - Levantar servidor (3001 + submodulos)
echo   [3] Campanas AI         - CMS campanas publicitarias IA (:8000)
echo   [4] SuitBoard           - Dashboard Crypto + US Market
echo   [0] Volver
echo ============================================================
choice /c 12340 /n /m "Selecciona: "
if errorlevel 5 goto :menu
if errorlevel 4 goto :suitboard
if errorlevel 3 goto :campanas
if errorlevel 2 goto :suitorg
if errorlevel 1 goto :diccionario
goto :menu

:diccionario
call "%~dp0SuitMiDBdic\run.bat"
goto :menu

:suitboard
call "%~dp0SuitBoard\abrir.bat"
goto :menu

:pinokio
start "" "C:\Users\rojo-\AppData\Local\Programs\Pinokio\Pinokio.exe"
goto :menu

:suitorg
call start_suitorg.bat
goto :menu

:freebuff
cls
echo ============================================================
echo   Freebuff - Agente de codificacion gratis
echo ============================================================
echo.
echo  Ejecutando freebuff en el directorio actual...
echo.
wsl -e bash -lc "freebuff"
goto :menu

:campanas
cls
echo ============================================================
echo   Campanas AI - CMS campanas publicitarias con IA
echo ============================================================
echo.
echo  Puerto: 8000
echo  URL:    http://localhost:8000
echo.

REM Detener cualquier instancia previa (si no, el server viejo se queda
REM corriendo y nunca toma cambios de codigo nuevos) y levantar una fresca.
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
set /a campkilltries=0
:campanas_killwait
set /a campkilltries+=1
if %campkilltries% gtr 15 goto campanas_killdone
netstat -aon | findstr ":8000" | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 ( timeout /t 1 /nobreak >nul & goto campanas_killwait )
:campanas_killdone

echo  [1/3] Iniciando servidor CampanasAi...
start "" /min cmd /c "cd /d %~dp0SuitCampanas && node local-server-node.js"
timeout /t 3 /nobreak >nul

REM Verificar si responde
set /a tries=0
:campanas_wait
set /a tries+=1
if %tries% gtr 30 goto campanas_timeout
powershell -NoProfile -Command "try { Invoke-WebRequest 'http://localhost:8000' -TimeoutSec 2 -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 ( timeout /t 1 /nobreak >nul & goto campanas_wait )

echo  [2/3] Servidor listo
echo  [3/3] Abriendo navegador...
start "" "http://localhost:8000"
echo.
echo  ============================================
echo    COMO USARLO
echo  ============================================
echo    1. Selecciona empresa en el selector
echo    2. Genera Brief -> MediaPlan -> Video
echo    3. Revisa tendencias en la pestana IA
echo  ============================================
echo.
goto :menu

:campanas_timeout
echo.
echo  [X] No respondio a tiempo. Revisa la ventana de CampanasAi.
goto :menu

:tools_ia_local
cls
echo ============================================================
echo   Tools IA Local - Selecciona opcion
echo ============================================================
echo   [1] Abrir OmniRoute (start-omniroute.bat)
echo   [2] MiroFish            - Swarm intelligence / prediccion
echo   [3] Preguntar a Hugging Face
echo   [4] Iniciar ComfyUI     - Generacion imagen/video local (:8188)
echo   [5] VoiceBox            - Text-to-Speech / voz local
echo   [0] Volver
echo ============================================================
choice /c 123450 /n /m "Selecciona: "
if errorlevel 6 goto :menu
if errorlevel 5 goto :voicebox
if errorlevel 4 goto :comfyui
if errorlevel 3 goto :ask_hf
if errorlevel 2 goto :mirofish
if errorlevel 1 goto :start_omniroute
goto :menu

:comfyui
echo.
echo [1/2] Iniciando ComfyUI (Comfy Desktop)...
start "" "C:\Users\rojo-\AppData\Local\Programs\ComfyUI\ComfyUI.exe"
echo [2/2] Abriendo opencode (MCP comfyui-mcp ya conectado) para pedir generacion...
start "" cmd /k "cd /d %~dp0 && title SuitOrg - opencode (ComfyUI) && opencode"
goto :menu

:ask_hf
call "%~dp0ask_hf.bat"
goto :menu

:start_omniroute
start "" "%~dp0start-omniroute.bat"
goto :menu

:voicebox
start "" "C:\Users\rojo-\AppData\Local\Programs\Voicebox\voicebox.exe"
goto :menu

:open_docs_folder
start "" "%~dp0docs"
goto :menu

:read_suitai_readme
start "" "%~dp0SuitAI\README.md"
goto :menu

:read_ollama_doc
start "" "%~dp0docs\OLLAMA_INTEGRACION.md"
goto :menu

:mirofish
echo.
echo Iniciando MiroFish...
echo.

REM Verificar si backend ya esta corriendo
netstat -ano | findstr ":5001" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [1/3] Iniciando backend (Flask en :5001)...
    start "" /min cmd /c "cd /d %~dp0MiroFish && uv run python backend/run.py"
    timeout /t 3 /nobreak >nul
) else (
    echo [1/3] Backend ya esta corriendo en :5001
)

REM Verificar si frontend ya esta corriendo
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [2/3] Iniciando frontend (Vue en :3000)...
    start "" /min cmd /c "cd /d %~dp0MiroFish\frontend && npm run dev"
    timeout /t 5 /nobreak >nul
) else (
    echo [2/3] Frontend ya esta corriendo en :3000
)

echo [3/3] Abriendo navegador...
start "" "http://localhost:3000"
echo.
echo MiroFish: http://localhost:3000
echo Backend:  http://localhost:5001
echo.
goto :menu

:fin
endlocal
exit