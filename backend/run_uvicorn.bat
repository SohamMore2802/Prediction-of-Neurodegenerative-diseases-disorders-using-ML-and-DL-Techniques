@echo off
REM Lightweight production run wrapper for the FastAPI app using uvicorn
REM Run this from the backend folder or call directly from a service manager

cd /d "%~dp0"
echo Starting uvicorn for NeuroCognitive backend...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info

pause
