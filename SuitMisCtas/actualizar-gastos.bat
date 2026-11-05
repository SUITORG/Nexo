@echo off
title SuitMisCtas - actualizar gastos
cd /d "%~dp0.."
echo Actualizando gastos de herramientas (opencode stats)...
node scripts\gastos-update.js
pause
