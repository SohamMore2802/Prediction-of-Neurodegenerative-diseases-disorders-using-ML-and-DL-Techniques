@echo off
title NeuroCognitive Insights - Launcher
color 0A

echo.
echo  ==========================================
echo   NeuroCognitive Insights - Starting Up
echo  ==========================================
echo.

REM Kill any stale python servers on port 8000 or 8080
echo [1/4] Clearing old server processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
echo [OK] Ports 8000 and 8080 cleared.
echo.

REM Install dependencies silently (skips if already installed)
echo [2/4] Checking dependencies...
pip install -q fastapi uvicorn pydantic python-multipart
echo [OK] Dependencies ready.
echo.

REM Start backend in a new window
echo [3/4] Starting Backend (http://localhost:8000)...
start "NeuroCognitive - BACKEND" /D "%~dp0backend" cmd /c "python main.py & pause"
echo [OK] Backend window launched.
echo.

REM Wait up to 20s for backend to be ready
echo [4/4] Waiting for backend to be ready...
set /a TRIES=0
:wait_loop
    powershell -NoProfile -Command "try{(iwr http://localhost:8000/health -UseBasicParsing -TimeoutSec 1).StatusCode}catch{0}" > "%TEMP%\hc.txt" 2>nul
    set /p STATUS=<"%TEMP%\hc.txt"
    if "%STATUS%"=="200" goto backend_ok
    set /a TRIES+=1
    if %TRIES% GEQ 20 goto timeout_warn
    timeout /t 1 /nobreak >nul
    goto wait_loop

:timeout_warn
echo [WARN] Backend took too long. Check the backend window for errors.
goto start_frontend

:backend_ok
echo [OK] Backend is healthy (HTTP 200).

:start_frontend
echo.
echo [+] Starting Frontend (http://localhost:8080)...
start "NeuroCognitive - FRONTEND" /D "%~dp0frontend" cmd /c "python -m http.server 8080 & pause"

REM Wait a moment then open browser
timeout /t 2 /nobreak >nul
echo [+] Opening browser...
start "" http://localhost:8080

echo.
echo  ==========================================
echo   All done! App is running.
echo.
echo   Frontend : http://localhost:8080
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo  ==========================================
echo.
echo  Close this window to stop nothing (servers run in their own windows).
echo  Close the BACKEND and FRONTEND windows to stop the servers.
echo.
pause
