@echo off
setlocal
cd /d "%~dp0"

REM Fecha YYMMDD (ej: 260810)
for /f %%i in ('powershell -NoProfile -Command "(Get-Date).ToString('yyMMdd')"') do set TS=%%i

set OUT=%cd%\..\SuitOrg%TS%.zip
if exist "%OUT%" (
  echo [!] Ya existe: %OUT%
  goto :end
)

echo [*] Creando backup %OUT% (esto puede tardar varios minutos) ...
REM tar.exe se cae (0xC0000005) con nombres CJK/emoji: se excluyen abajo (MCP_??_??.md y el .html con emoji). Otro asi = renombrar o excluir.
tar -a -c -f "%OUT%" ^
  --exclude=node_modules ^
  --exclude=.git ^
  --exclude=.venv* ^
  --exclude=__pycache__ ^
  --exclude=.wwebjs_auth ^
  --exclude=.wwebjs_cache ^
  --exclude=.playwright-mcp ^
  --exclude=*.zip ^
  --exclude=*.rar ^
  --exclude=*.7z ^
  --exclude=*.pyc ^
  --exclude=*.png ^
  --exclude=*.jpg ^
  --exclude=*.jpeg ^
  --exclude=*.mp4 ^
  --exclude=*.pdf ^
  --exclude=SuitCVLO/data ^
  --exclude=SuitCVLO/output ^
  --exclude=SuitCVLO/uploads ^
  --exclude=media ^
  --exclude=_LEGACY_BACKUPS ^
  --exclude=SuitCVLO/dataset_yolo ^
  --exclude=out ^
  --exclude=dist ^
  --exclude=jdk-21.0.2 ^
  --exclude=neo4j-community-5.26.0 ^
  --exclude=MCP_??_??.md ^
  --exclude=*-v33-FINAL-COMPLETA-44-SECCIONES-ENRIQUECIDO-EDGE-OK.html ^
  .

if errorlevel 1 (
  echo [X] Fallo al crear el zip
  goto :end
)

set "MBSIZE=0"
for /f "tokens=3" %%s in ('dir /-c "%OUT%" ^| findstr /i ".zip"') do set MBSIZE=%%s
echo [OK] Backup creado: %OUT%
echo      Tamano: %MBSIZE% bytes

:end
endlocal
pause