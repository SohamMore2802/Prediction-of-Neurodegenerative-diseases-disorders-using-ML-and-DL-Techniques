@echo off
REM Auto-Start - NeuroCognitive Backend + Frontend
REM Simplified version that handles paths with special characters

echo.
echo ======================================================
echo NeuroCognitive Insights - Auto Startup
echo ======================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo During installation, MUST check: "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo [OK] Python is available
echo.

REM Check pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pip not found. Please reinstall Python.
    pause
    exit /b 1
)

echo [OK] pip is available
echo.

REM Install backend dependencies
echo [SETUP] Installing FastAPI dependencies...
python -m pip install --quiet fastapi uvicorn python-multipart

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed
echo.

REM Start backend
echo ======================================================
echo [1/2] Starting Backend Server (http://localhost:8000)
echo ======================================================
start "NeuroCognitive-Backend" cmd /k ^
    "cd /d \"%~dp0backend\" && ^
     echo [START] Backend initializing... && ^
     echo. && ^
     python main.py && ^
     pause"

echo Waiting for backend to initialize (polling health up to 30s)...
set /a ATTEMPTS=0
set MAX_ATTEMPTS=30
:wait_backend
    powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8000/health' -TimeoutSec 2).StatusCode } catch { Write-Output '0' }" > "%temp%\backend_health_status.txt"
    for /f "usebackq delims=" %%S in ("%temp%\backend_health_status.txt") do set STATUS=%%S
    if "%STATUS%"=="200" goto backend_ready
    set /a ATTEMPTS+=1
    if %ATTEMPTS% geq %MAX_ATTEMPTS% goto backend_timeout
    timeout /t 1 >nul
    goto wait_backend

:backend_ready
    echo [OK] Backend responded with HTTP 200.
    del "%temp%\backend_health_status.txt" 2>nul || echo.
  
:backend_timeout
    if "%STATUS%"=="200" (
        echo [OK] Backend responded with HTTP 200.
    ) else (
        echo [WARN] Backend did not respond within %MAX_ATTEMPTS% seconds. It may still be starting or encountered an error.
        echo Check the backend terminal window for errors and retry.
    )

REM Start frontend
echo.
echo ======================================================
echo [2/2] Starting Frontend Server (http://localhost:8080)
echo ======================================================
start "NeuroCognitive-Frontend" cmd /k ^
    "cd /d \"%~dp0frontend\" && ^
     echo [START] Frontend initializing... && ^
     echo. && ^
     python -m http.server 8080 && ^
     pause"

echo Waiting for frontend to initialize (2 seconds)...
timeout /t 2 /nobreak

echo.
echo ======================================================
echo Startup Complete!
echo ======================================================
echo.
echo Frontend:  http://localhost:8080
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo Health:    http://localhost:8000/health
echo.
echo Opening frontend in browser (3 seconds)...
timeout /t 3 /nobreak

start http://localhost:8080

echo.
echo *** IMPORTANT ***
echo If you see a "Cannot connect to backend" error in the browser:
echo 1. Check that BOTH server windows are running without errors
echo 2. Allow Windows Firewall access if prompted
echo 3. Check browser console (F12) for detailed error messages
echo.

