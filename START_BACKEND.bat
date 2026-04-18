@echo off
REM Start NeuroCognitive Backend Server
REM This script properly handles the path with special characters

echo.
echo ====================================
echo NeuroCognitive Backend - FastAPI
echo ====================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in PATH
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [OK] Python is available
echo.

REM Install dependencies
echo [SETUP] Installing dependencies...
python -m pip install --quiet fastapi uvicorn python-multipart

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [OK] Dependencies installed
echo.

REM Start server
echo ====================================
echo [START] Starting FastAPI server...
echo ====================================
echo.
echo Server Details:
echo   - URL: http://localhost:8000
echo   - Health Check: http://localhost:8000/health
echo   - API Documentation: http://localhost:8000/docs
echo   - Interactive API: http://localhost:8000/redoc
echo.
echo To stop the server, press CTRL+C
echo.
echo ====================================

cd /d "%~dp0backend"
python main.py

pause
