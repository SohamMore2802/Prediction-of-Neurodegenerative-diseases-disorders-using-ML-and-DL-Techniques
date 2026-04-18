@echo off
REM Start NeuroCognitive Frontend
REM Simple HTTP server using Python's built-in server OR Node.js Live Server

echo.
echo ====================================
echo NeuroCognitive Frontend
echo ====================================
echo.

REM Try Node.js first (doesn't require Python)
node --version >nul 2>&1
if not errorlevel 1 (
    echo Using Node.js Live Server...
    
    REM Check if http-server is installed globally
    npx http-server -p 8080 -c-1
    pause
    exit /b 0
)

REM Fall back to Python if Node.js not available
python -m http.server 8080 -d .

pause
