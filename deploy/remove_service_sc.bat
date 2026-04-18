@echo off
REM Remove NeuroCognitive backend Windows service
REM Usage: Run as Administrator: remove_service_sc.bat

set SERVICE_NAME=NeuroCognitiveBackend

echo Stopping service %SERVICE_NAME% (if running)...
sc stop "%SERVICE_NAME%" 2>nul || echo Service not running or stop failed

echo Deleting service %SERVICE_NAME%...
sc delete "%SERVICE_NAME%"

echo Done.
