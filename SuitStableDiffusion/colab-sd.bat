@echo off
echo ============================================
echo   STABLE DIFFUSION VIA GOOGLE COLAB
echo ============================================
echo.
echo INSTRUCCIONES:
echo 1. Se abrira el navegador con Google Colab
echo 2. INICIA SESION con tu cuenta de Google
echo 3. El script hara el resto automaticamente
echo.

set /p PROMPT="Escribe tu prompt (o deja vacio para default): "

if "%PROMPT%"=="" (
    node scripts\colab-sd.js "a beautiful sunset over mountains, digital art"
) else (
    node scripts\colab-sd.js "%PROMPT%"
)

pause
