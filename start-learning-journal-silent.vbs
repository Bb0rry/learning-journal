Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectDir = fso.GetParentFolderName(WScript.ScriptFullName)

shell.CurrentDirectory = projectDir
shell.Run "cmd /c npm run dev", 0, False

WScript.Sleep 3500
shell.Run "http://127.0.0.1:5173/", 1, False
