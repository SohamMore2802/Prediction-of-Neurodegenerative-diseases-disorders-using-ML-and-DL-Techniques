**Installing the FastAPI backend as a Windows Service (sc.exe method)**

Prerequisites:
- Windows Administrator access
- Python installed and available on `PATH`

Steps:

1. Start an elevated (Administrator) command prompt or PowerShell.

2. (Optional) Test running the backend manually:

```powershell
cd 'C:\R&I\\backend'
python main.py
```

3. Install service (runs `main.py` using Python found on PATH):

```powershell
cd 'C:\R&I\\deploy'
.\install_service_sc.bat
```

4. Verify service status:

```powershell
sc query "NeuroCognitiveBackend"
```

5. To remove the service:

```powershell
cd 'C:\R&I\\deploy'
.\remove_service_sc.bat
```

Notes and recommendations:
- `sc` uses the executable path directly. If multiple Python installations exist, ensure the expected `python.exe` is first in `PATH` before running the installer script.
- Using `nssm` (Non-Sucking Service Manager) is recommended for advanced control (auto-restart, stdout/stderr logging). If you want, I can add an `nssm`-based installer script.
- Open port 8000 in Windows Firewall if the service needs to be reachable from other machines.
  - To allow port 8000:

```powershell
New-NetFirewallRule -DisplayName "Allow NeuroCognitive Backend" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000
```

Security:
- For production, run behind a reverse proxy (IIS/nginx) and terminate TLS at the proxy. Avoid exposing uvicorn directly to the public internet without TLS and a hardened host.
