@echo off
REM Start NeuroCognitive Backend - Python Only

echo ====================================
echo NeuroCognitive Backend - FastAPI
echo ====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo.
    echo Download Python from: https://www.python.org/downloads/
    echo During installation, check: "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

echo Python detected!
echo.

REM Install requirements from parent directory
