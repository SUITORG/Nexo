@echo off
setlocal
chcp 65001 >nul
title Configuracion GitHub + git en WSL2 (Ubuntu)

REM ===== EDITA ESTAS DOS LINEAS =====
set "GIT_NAME=Roberto Padron"
set "GIT_EMAIL=rbtpdrn@gmail.com"
REM ==================================

echo.
echo ============================================
echo  1/5  Verificando WSL y herramientas
echo ============================================
wsl -d Ubuntu -e bash -lc "gh --version; git --version" || goto :error

echo.
echo ============================================
echo  2/5  Configurando tu identidad en git
echo ============================================
wsl -d Ubuntu -e bash -lc "git config --global user.name '%GIT_NAME%' && git config --global user.email '%GIT_EMAIL%' && git config --global init.defaultBranch main && git config --global pull.rebase false && echo Identidad configurada." || goto :error

echo.
echo ============================================
echo  3/5  Autenticando con GitHub (interactivo)
echo ============================================
echo  Elige:  GitHub.com  ^>  HTTPS  ^>  Y  ^>  Login with a web browser
echo  Copia el codigo de 8 caracteres y pegalo en el navegador.
echo.
wsl -d Ubuntu -e bash -lc "gh auth status >/dev/null 2>&1 && echo 'Ya estabas autenticado, saltando login.' || gh auth login"

echo.
echo ============================================
echo  4/5  Dejando gh como credential helper
echo ============================================
wsl -d Ubuntu -e bash -lc "gh auth setup-git; gh config set git_protocol https; git config --global credential.helper '!gh auth git-credential'; echo Helper listo."

echo.
echo ============================================
echo  5/5  Verificacion final
echo ============================================
wsl -d Ubuntu -e bash -lc "echo '--- gh auth status ---'; gh auth status; echo; echo '--- config de git ---'; git config --global --list | grep -E 'user\.|credential|protocol|defaultBranch'"

echo.
echo ============================================
echo  LISTO. Si arriba ves 'Logged in to github.com'
echo  ya puedes usar git y OpenCode sin pedir claves.
echo ============================================
echo.
pause
exit /b 0

:error
echo.
echo *** Ocurrio un error. Copia el mensaje de arriba para revisarlo. ***
pause
exit /b 1
