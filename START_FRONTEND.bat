@echo off
REM Start NeuroCognitive Frontend Server
REM This serves the HTML/CSS/JS files

echo.
echo ====================================
echo NeuroCognitive Frontend - HTTP Server
echo ====================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in PATH
    echo Please install Python from: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [OK] Python is available
echo.

echo ====================================
echo [START] Starting frontend server...
echo ====================================
echo.
echo Server Details:
echo   - URL: http://localhost:8080
echo   - Directory: %~dp0frontend
echo.
echo Backend must be running on http://localhost:8000
echo.
echo To stop the server, press CTRL+C
echo.
echo ====================================

cd /d "%~dp0frontend"
python -m http.server 8080

pause
