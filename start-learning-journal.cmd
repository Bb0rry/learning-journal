@echo off
setlocal

cd /d "%~dp0"

start "Learning Journal Dev Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5173/"

endlocal
