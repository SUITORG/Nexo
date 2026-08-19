@echo off
cd /d "%~dp0"
start "opencode-watcher" cmd /k python -m opencode_watcher.watcher
start "telegram-bot" cmd /k python -m tg_bot.bot
echo Ambos procesos iniciados en ventanas separadas.
echo Cierra las ventanas para detenerlos.
