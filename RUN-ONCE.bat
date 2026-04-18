@echo off
REM Run backend and frontend once (manual, no services).
REM Backend runs in this window. Close this window to stop the backend.

echo ======================================================
echo NeuroCognitive - Run Once (No persistent services)
echo ======================================================
echo.

echo 1) Starting backend in this window (press Ctrl+C to stop)...
cd /d "%~dp0\backend"
python main.py

echo Backend stopped. If frontend was started in another window, close it manually.
pause
