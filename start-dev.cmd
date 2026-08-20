@echo off
setlocal

REM Start both backend and frontend in separate terminal windows.
REM Usage: run this file from anywhere inside project folder.

set "ROOT=%~dp0"

start "DAVLibri Server" cmd /k "cd /d ""%ROOT%server"" && npm.cmd run dev"
start "DAVLibri Client" cmd /k "cd /d ""%ROOT%client"" && npm.cmd run dev -- --host"

echo Started:
echo - Server: http://localhost:3000
echo - Client: http://localhost:5173
echo.
echo Close the opened terminals to stop the app.

endlocal
