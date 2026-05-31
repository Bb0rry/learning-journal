Set shell = CreateObject("WScript.Shell")
command = "powershell -NoProfile -ExecutionPolicy Bypass -Command ""$ports = 5173,3001; $pids = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($pid in $pids) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }"""
shell.Run command, 0, True
