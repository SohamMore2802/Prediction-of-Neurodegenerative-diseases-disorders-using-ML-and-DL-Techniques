@echo off
REM ============================================
REM NeuroCognitive Insights - Complete Startup
REM ============================================

setlocal enabledelayedexpansion

echo.
echo ============================================
echo NeuroCognitive Insights Startup
echo ============================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check if venv exists
if not exist ".venv" (
    echo [ERROR] Virtual environment not found!
    echo.
    echo Please run SETUP_ONCE.bat first to create the virtual environment.
    pause
    exit /b 1
)

echo [1/3] Checking Python environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [OK] Virtual environment activated
echo.

echo [2/3] Starting FastAPI Backend Server...
echo.
echo Backend is starting at http://localhost:8000
echo Press CTRL+C in the backend window to stop it
echo.
start "NeuroCognitive Backend" cmd /k "cd /d "%SCRIPT_DIR%\backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait 2 seconds for backend to start
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend Server...
echo.
echo Frontend will be available at http://localhost:8080
echo Press CTRL+C in the frontend window to stop it
echo.
start "NeuroCognitive Frontend" cmd /k "cd /d "%SCRIPT_DIR%" && python -m http.server 8080 -d frontend"

echo.
echo ============================================
echo ✅ SERVERS STARTING!
echo ============================================
echo.
echo Frontend:  http://localhost:8080
echo Backend:   http://localhost:8000
echo Health:    http://localhost:8000/health
echo API Docs:  http://localhost:8000/docs
echo.
echo Opening frontend in browser...

REM Small delay to ensure server is ready
timeout /t 3 /nobreak >nul

REM Try to open in browser (requires Windows 10+)
start http://localhost:8080

echo.
echo Press any key to continue...
pause > nul

endlocal
