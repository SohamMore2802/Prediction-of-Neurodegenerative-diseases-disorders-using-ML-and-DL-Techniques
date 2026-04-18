@echo off
REM Quick start script for NeuroCognitive Insights

echo ====================================
echo NeuroCognitive Insights - Quick Start
echo ====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo.
    echo Download Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [1/3] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Starting FastAPI backend server...
echo Backend will run on http://localhost:8000
echo.
echo Starting uvicorn...
cd backend
start cmd /k "python main.py"
cd ..

echo.
echo [3/3] Starting frontend server...
echo Frontend will run on http://localhost:8080
echo.
start cmd /k "python -m http.server 8080 -d frontend"

echo.
echo ====================================
echo Servers starting...
echo.
echo Frontend: http://localhost:8080
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Two terminal windows will open automatically.
echo ====================================
pause
