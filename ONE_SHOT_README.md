One-shot (manual) run instructions
=================================

Goal: Start the backend and frontend only when you manually run them. When you exit, nothing restarts automatically.

Run backend (foreground):

```powershell
cd 'C:\R&I'
.\RUN-ONCE.bat
```

This will start the backend in the current window. Press Ctrl+C or close the window to stop the backend. No service is installed and nothing auto-restarts.

Run frontend (optional separate window):

```powershell
cd 'C:\R&I\frontend'
python -m http.server 8080
```

Stop/cleanup (if anything left listening on ports):

```powershell
cd 'C:\R&I'
.\STOP_SERVERS.bat
```

Notes:
- Do NOT run `install_service_sc.bat` if you want one-shot runs only (that script installs a Windows service).
- If you previously installed the service, run `deploy\remove_service_sc.bat` as Administrator to remove it.
- `RUN-ONCE.bat` is intentionally simple: it runs the backend in the foreground so nothing persists after you stop it.
