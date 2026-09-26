@echo off
cd /d "%~dp0"
node scan.js --live
start "" "%~dp0index.html"
