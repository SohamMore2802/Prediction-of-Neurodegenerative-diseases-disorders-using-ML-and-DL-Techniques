# Backend Connection Fix Guide

## ⚠️ Error: "Cannot connect to backend server"

This error means the **FastAPI backend server is not running**. Here's how to fix it:

---

## 🚀 QUICK FIX (Recommended - 30 seconds)

### Windows Users:
1. **Double-click** `START_SERVERS.bat` in your project folder
2. Wait for 2 terminal windows to open
3. Refresh your browser (or open http://localhost:8080)
4. ✅ Done!

### Mac/Linux Users:
```bash
# Terminal 1 - Start Backend:
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Start Frontend:
python -m http.server 8080 -d frontend
```

Then open your browser to: **http://localhost:8080**

---

## 🔧 Manual Verification Steps

### 1. Check if Backend is Running
Open this URL in your browser:
- **http://localhost:8000/health**

You should see:
```json
{"status": "ok"}
```

If you get a connection error, follow the "Starting the Backend" section below.

### 2. Check FastAPI Documentation
Once backend is running, visit:
- **http://localhost:8000/docs** - Interactive API docs
- **http://localhost:8000/redoc** - API documentation

### 3. Check Frontend Connection
Open browser console (F12) and check for network errors when trying to run an assessment.

---

## 📋 Starting the Backend Manually

### Step 1: Activate Virtual Environment

**Windows:**
```bash
.venv\Scripts\activate
```

**Mac/Linux:**
```bash
source .venv/bin/activate
```

### Step 2: Start the Backend Server

**Option A - Development mode (auto-reload):**
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Option B - Direct Python run:**
```bash
python backend/main.py
```

**Option C - Using the batch file (Windows only):**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info
```

You should see output like:
```
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 3: Verify Server is Working

In **another terminal**, run:

**Windows:**
```powershell
curl.exe http://localhost:8000/health
# Or use PowerShell:
Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing | ConvertTo-Json
```

**Mac/Linux:**
```bash
curl http://localhost:8000/health
```

You should see: `{"status":"ok"}`

---

## 🔍 Troubleshooting Common Issues

### Issue: "Port 8000 already in use"

**Solution:** Another process is using port 8000.

**Windows:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace XXXX with PID)
taskkill /PID XXXX /F

# Then restart the backend
python backend/main.py
```

**Mac/Linux:**
```bash
# Find process
lsof -i :8000

# Kill the process
kill -9 PID
```

### Issue: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:** Install dependencies:
```bash
python -m pip install -r requirements.txt
```

### Issue: "Permission denied" (Mac/Linux)

**Solution:** Make script executable:
```bash
chmod +x backend/run.sh
./backend/run.sh
```

### Issue: "Connection refused" in browser

**Solution:** 
1. Check backend terminal for errors
2. Verify the URL: `http://localhost:8000` (port 8000)
3. Ensure backend hasn't crashed
4. Check if Windows Firewall is blocking (Windows users)

---

## 🆘 Windows Firewall Issues

If you see connection timeouts after starting the backend:

1. **Open Windows Defender Firewall**
2. Click "Allow an app through firewall"
3. Click "Change settings" (admin password may be needed)
4. Click "Allow another app"
5. Browse to your Python executable in `.venv\Scripts\python.exe`
6. Click "Add"
7. Make sure it's allowed on both "Private" and "Public" networks

---

## 📝 Architecture Overview

```
User Browser (Port 8080)
         ↓
    Frontend HTML/CSS/JS
         ↓ (HTTP Request)
    Tries to reach Port 8000
         ↓
Backend FastAPI Server (Port 8000)
         ↓
    Processes prediction
         ↓
    Returns JSON response
```

If any part is missing, you'll get the "Cannot connect" error.

---

## ✅ Health Check Endpoints

Test these URLs to verify your setup:

| URL | Expected Response | Meaning |
|-----|-------------------|---------|
| `http://localhost:8000/health` | `{"status":"ok"}` | Backend is running |
| `http://localhost:8000/docs` | Swagger UI | API documentation page |
| `http://localhost:8080` | HTML page | Frontend is loaded |

---

## 🎯 Complete Startup Log Example

When everything is working:

**Terminal 1 (Backend):**
```
PS C:\R&I> python backend/main.py
INFO:     Started server process [4480]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Terminal 2 (Frontend):**
```
PS C:\R&I> python -m http.server 8080 -d frontend
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/)
```

**Browser Console:**
```
No errors related to localhost:8000
Successfully loaded health check: {"status":"ok"}
```

---

## 📚 Related Documentation

- **START_HERE.md** - Quick start guide
- **GETTING_STARTED.md** - Detailed setup
- **PROJECT_STRUCTURE.md** - Project layout
- **requirements.txt** - Python dependencies

---

## 🆘 Still Having Issues?

1. **Check if ports are correct:**
   - Frontend: `8080`
   - Backend: `8000`

2. **Read error messages carefully** - they often indicate the exact problem

3. **Restart VS Code** - sometimes helps with terminal issues

4. **Start fresh:**
   ```bash
   # Kill all Python processes
   # Windows:
   taskkill /F /IM python.exe
   
   # Mac/Linux:
   killall python
   
   # Then try again
   python backend/main.py
   ```

5. **Check firewall** - especially on corporate networks

6. **Review logs** - backend often logs helpful error messages
