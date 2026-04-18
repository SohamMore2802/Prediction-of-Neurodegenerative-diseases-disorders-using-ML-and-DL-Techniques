@echo off
REM Install NeuroCognitive backend as a Windows service using sc.exe
REM Usage: Run as Administrator: install_service_sc.bat

set SERVICE_NAME=NeuroCognitiveBackend
set PYTHON_PATH=

:: Try to find Python in PATH
for /f "usebackq tokens=*" %%a in (`where python 2^>nul`) do set PYTHON_PATH=%%a & goto :found
echo Python not found in PATH. Please add Python to PATH or set PYTHON_PATH in this script.
goto :eof

:found
echo Using Python at %PYTHON_PATH%

set BINPATH=%PYTHON_PATH% "%~dp0\..\backend\main.py"
echo Creating service %SERVICE_NAME% with binPath: %BINPATH%

sc create "%SERVICE_NAME%" binPath= "%BINPATH%" start= auto DisplayName= "%SERVICE_NAME%"
if errorlevel 1 (
  echo Failed to create service. You may need to run this script as Administrator.
  goto :eof
)

echo Service created. Starting service...
sc start "%SERVICE_NAME%"

echo Done. Check service status with: sc query "%SERVICE_NAME%"
