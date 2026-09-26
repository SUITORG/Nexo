@echo off
cd /d "%~dp0"
echo Sondeando MCPs en OpenCode y Claude Code (puede tardar ~1 min)...
node scan.js --live --probe
start "" "%~dp0index.html"
