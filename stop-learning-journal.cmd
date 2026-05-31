@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = 5173,3001; $pids = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($pid in $pids) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }"

echo Learning Journal dev server stopped.
timeout /t 2 /nobreak >nul

endlocal
