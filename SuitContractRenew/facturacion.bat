@echo off
title ContractRenew — Facturación
cd /d "%~dp0"
color 0b
cls

echo  ╔═══════════════════════════════════════╗
echo  ║   ContractRenew — Facturación          ║
echo  ╚═══════════════════════════════════════╝
echo.

python python\main.py facturacion

echo.
ping -n 4 127.0.0.1 >nul
