# Backend Connection Fix - Complete Guide

## ✅ Issue Identified & Fixed

**Root Cause:** The backend server startup scripts had path handling issues due to the `&` character in `c:\R&I\`. This prevented proper server initialization.

---

## 🚀 QUICK START (Pick One)

### Option 1: Auto-Start Both (RECOMMENDED)
**Run:** `RUN-ALL.bat` (in the root directory)
- Starts both backend and frontend automatically
- Opens frontend in browser
- Simplest method

### Option 2: Manual Start (for debugging)
**Terminal 1 - Backend:**
```
cd c:\R&I
START_BACKEND.bat
```

**Terminal 2 - Frontend:**
```
cd c:\R&I
START_FRONTEND.bat
```

### Option 3: From Original Scripts
**Backend only:**
```
cd c:\R&I\backend
python backend/main.py
```

**Frontend only (in browser, open directly):**
```
file:///c:/R&I/frontend/index.html
```

---

## ✅ Verification Checklist

Check these URLs in your browser:

- **Backend Health:** http://localhost:8000/health
  - Should show: `{"status":"ok"}`

- **API Documentation:** http://localhost:8000/docs
  - Interactive API explorer

- **Frontend:** http://localhost:8080 (or open frontend/index.html)
  - Should load the NeuroCognitive interface

---

## 🔧 Troubleshooting

### Problem: "Cannot connect to backend server"

**Solution 1: Verify Backend is Running**
1. Open http://localhost:8000/health in browser
2. Should show `{"status":"ok"}`
3. If not, restart backend:
   ```
   cd c:\R&I\backend
   python main.py
   ```

**Solution 2: Clear Browser Cache**
1. Press `Ctrl+Shift+Delete` in browser
2. Clear all cookies and cache
3. Reload page

**Solution 3: Check Firewall (Windows)**
1. Windows Defender Firewall may block Python
2. Allow Python through firewall:
   - Settings → Privacy & Security → Windows Defender Firewall → Allow an app through
   - Find Python and enable

**Solution 4: Force Port Release**
```powershell
# Kill any process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or find what's using port 8080
netstat -ano | findstr :8080
```

---

## 📋 What Was Fixed

### 1. **RUN-ALL.bat**
- ✅ Removed hardcoded Python path (was causing failures)
- ✅ Uses Python from PATH (works with any installation)
- ✅ Proper error checking
- ✅ Better timeout handling (4 seconds for backend to start)
- ✅ Added detailed troubleshooting messages

### 2. **START_BACKEND.bat** (New)
- ✅ Simplified backend startup
- ✅ Proper path handling with special characters (`&`)
- ✅ Automatic dependency installation
- ✅ Clear feedback messages

### 3. **START_FRONTEND.bat** (New)
- ✅ Dedicated frontend startup script
- ✅ Clean HTTP server setup
- ✅ Clear port information

### 4. **backend/run.bat**
- ✅ Updated for better compatibility

---

## 🔍 How It Works

The application uses:
- **Backend:** FastAPI on `http://localhost:8000`
- **Frontend:** Static HTML/CSS/JS on `http://localhost:8080`
- **Communication:** Frontend makes HTTP requests to backend's `/predict` endpoint

The frontend checks backend health at startup and displays helpful errors if backend isn't available.

---

## 🛠️ Manual Server Start (if scripts fail)

**Terminal 1 - Backend:**
```powershell
cd 'c:\R&I\backend'
python -m pip install fastapi uvicorn python-multipart
python main.py
```

**Terminal 2 - Frontend:**
```powershell
cd 'c:\R&I\frontend'
python -m http.server 8080
```

Then open:
- Frontend: http://localhost:8080
- Backend: http://localhost:8000/health

---

## 📊 Expected Output

**Backend Starting:**
```
INFO:     Started server process [1234]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Frontend Starting:**
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

---

## ✨ Advanced: Direct File Access

If you just want to use the frontend without the HTTP server:
1. Open `c:\R&I\frontend\index.html` in browser
2. Note: Some features may be limited without HTTP server
3. Recommended: Use HTTP server for best results

---

## 🆘 Still Having Issues?

1. **Check Python:** `python --version`
2. **Check Pip:** `pip --version`
3. **Reinstall deps:** 
   ```
   pip install --upgrade fastapi uvicorn python-multipart
   ```
4. **Check ports:**
   ```
   netstat -ano | findstr ":8000\|:8080"
   ```
5. **Open browser console (F12)** - check for CORS or network errors

---

## 📝 Notes

- All scripts now handle paths with special characters (`&`, spaces, etc.)
- Dependencies auto-install on first run
- Servers run on standard HTTP ports (8000, 8080)
- Full CORS support enabled for development
- No firewall bypass needed on localhost

---

**Last Updated:** 2026-02-25
