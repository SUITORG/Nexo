@echo off
title ContractRenew — Recuperar PIN
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║   ContractRenew — Recuperar PIN        ║
echo  ╚═══════════════════════════════════════╝
echo.

if not exist taller.json (
    echo  [!] No hay cuenta creada en esta computadora.
    echo      Abre cliente.bat y usa "Crear cuenta" para generar una nueva.
    echo.
    pause
    exit /b 1
)

echo  Tu PIN es:
echo.
powershell -Command "(Get-Content taller.json | ConvertFrom-Json).pin"
echo.
echo  ─────────────────────────────────────────
echo   Escrito con tu cuenta creada en esta misma
echo   carpeta. Si reinstalaste el programa o
echo   cambiaste de computadora, crea una cuenta
echo   nueva desde cliente.bat.
echo  ─────────────────────────────────────────
echo.
pause
