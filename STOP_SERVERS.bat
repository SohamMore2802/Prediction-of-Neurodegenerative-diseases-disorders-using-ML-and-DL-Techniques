@echo off
REM Stop servers running on ports 8000 and 8080 (Windows)
echo Stopping servers on ports 8000 and 8080 if any...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 "') do (
  echo Killing PID %%a (port 8000)
  taskkill /PID %%a /F >nul 2>&1 || echo Failed to kill %%a
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 "') do (
  echo Killing PID %%a (port 8080)
  taskkill /PID %%a /F >nul 2>&1 || echo Failed to kill %%a
)

echo Additionally, you can stop Python processes manually if required:
echo   taskkill /IM python.exe /F

echo Done.
pause
