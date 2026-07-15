@echo off
cd /d "%~dp0"
python -m opencode_watcher.watcher
pause
