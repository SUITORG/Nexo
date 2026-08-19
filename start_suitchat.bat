@echo off
title SuitChatTG - Telegram Bot
cd /d "%~dp0SuitChatTG"
echo.
echo  ^>^>^> Iniciando SuitChatTG (Telegram Bot) ^<^<^<
echo.
echo   Puerto: 3011
echo   Bot:    @RoommateNL_bot
echo   URL:    http://localhost:3011
echo   Health: http://localhost:3011/api/health
echo.
echo   Presiona Ctrl+C para detener
echo.
node index.js
pause
