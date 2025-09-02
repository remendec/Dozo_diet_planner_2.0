@echo off
cd /d "%~dp0"
start "Dozo API" cmd /k node server.js
timeout /t 2 >nul
start "" "http://localhost:8787/index.html"