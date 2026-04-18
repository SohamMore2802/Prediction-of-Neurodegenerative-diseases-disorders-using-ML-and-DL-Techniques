# 🚀 SETUP & TESTING - START HERE

## ✅ What Was Fixed

Your frontend had weak error handling when the backend was unavailable. I've added:

✅ **Server health checks** - Verify backend is alive before trying to predict  
✅ **Input validation** - Catch errors before sending to server  
✅ **Timeout protection** - 15-second timeout prevents hanging  
✅ **Automatic retries** - Recovers from temporary network issues  
✅ **User-friendly errors** - Shows what went wrong + how to fix it  
✅ **Retry button** - One-click recovery from errors  
✅ **Console logging** - Detailed error messages for debugging  

---

## 🎯 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start Both Servers
```bash
start-dev.bat
```

This opens 2 terminal windows:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:8080

### Step 3: Test Each Disease Page
Open these in your browser:
- http://localhost:8080/alzheimers.html
- http://localhost:8080/parkinsons.html
- http://localhost:8080/als.html
- http://localhost:8080/huntington.html

---

## 🧪 Quick Test (2 minutes)

1. Open: **http://localhost:8080/alzheimers.html**

2. Fill in sample data:
   ```
   Age: 72
   Sex: Female
   ELISA Biomarker 1: 1.6
   ELISA Biomarker 2: 0.9
   Cognitive Score: 21.5
   MRI Severity: 0.65
   ECG/EEG Anomaly: 0.30
   ```

3. Click **"Run Alzheimer's Assessment"**

4. **Expected Result:** See risk score and recommendations

---

## 🧪 Test Error Handling (2 minutes)

1. **Stop the backend** - Ctrl+C in backend terminal

2. Try to submit form again

3. **See error message** with troubleshooting steps

4. **Click "Retry Assessment"** button

5. **Start backend again** - `python backend/main.py` in backend directory

6. **Click "Retry Assessment"** again

7. **It should work now!** ✅

---

## 📋 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `frontend/app.js` | ✅ ENHANCED - Added error handling, retry logic, validation | Ready |
| `alzheimers.html` | No changes needed (uses updated app.js) | Ready |
| `parkinsons.html` | No changes needed (uses updated app.js) | Ready |
| `als.html` | No changes needed (uses updated app.js) | Ready |
| `huntington.html` | No changes needed (uses updated app.js) | Ready |
| `backend/main.py` | No changes needed (already correct) | Ready |

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:8080 |
| **Backend** | http://localhost:8000 |
| **Health Check** | http://localhost:8000/health |
| **API Docs** | http://localhost:8000/docs |
| **Swagger UI** | http://localhost:8000/docs |

---

## 🆘 Troubleshooting

### Issue: "Cannot connect to backend server"
```bash
# Check if server is running
curl http://localhost:8000/health

# If not running, start it
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Then click "Retry Assessment" in the UI
```

### Issue: "Request timeout"
```bash
# Server is too slow or unresponsive
# Restart the backend
# Then click "Retry Assessment"
```

### Issue: Validation errors for specific fields
```
# Check your input values:
- Age: must be 18-120
- Cognitive Score: must be 0-100  
- MRI Severity: must be 0-1
- ECG/EEG Anomaly: must be 0-1
```

### Issue: "HTTP 500: Internal Server Error"
```bash
# Backend crashed
# Check the terminal where backend is running for error messages
# Restart the backend
# Try again
```

---

## 📚 Documentation Files

I've created detailed guides in your project:

1. **BACKEND_ERROR_FIX.md** - Complete fix explanation
2. **QUICK_REFERENCE_FIXES.md** - Quick reference for all 4 diseases
3. **CODE_CHANGES_DETAILED.md** - Technical deep dive of changes

---

## 🎓 What Each Disease Page Does

All 4 pages work the same way, just with different biomarkers:

### Alzheimer's Disease
- **Biomarkers**: Amyloid-beta (Aβ42), tau, p-tau
- **Imaging**: MRI cortical atrophy pattern
- **Assessment**: Cognitive decline + biomarkers

### Parkinson's Disease  
- **Biomarkers**: Alpha-synuclein, complementary markers
- **Imaging**: ECG/EEG motor pattern anomalies
- **Assessment**: Motor + cognitive features

### ALS (Amyotrophic Lateral Sclerosis)
- **Biomarkers**: Motor neuron disease markers
- **Imaging**: MRI spinal cord analysis
- **Assessment**: Motor neuron degeneration

### Huntington's Disease
- **Biomarkers**: Huntingtin protein markers
- **Imaging**: MRI striatal atrophy
- **Assessment**: Motor + cognitive decline

**Result**: Risk score (0-1) + Risk level (Low/Moderate/High)

---

## 📊 Key Improvements

### Before
```
User fills form → Submit → Error: "Something went wrong"
User confused ❌
```

### After
```
User fills form → Validation ✓ → Health check ✓ → Submit 
→ On error: Shows what's wrong + how to fix it
→ Click "Retry Assessment" → Automatic retry with exponential backoff
→ User gets results ✓ OR clear next steps
```

---

## 🎯 Next Steps

1. ✅ **Install dependencies**: `pip install -r requirements.txt`
2. ✅ **Start servers**: `start-dev.bat`
3. ✅ **Test all 4 pages**: Fill form + submit
4. ✅ **Test error handling**: Stop server + try submit + click retry
5. ✅ **Review error messages**: They should be clear and helpful

---

## ⚡ Pro Tips

**Tip 1: Use the Health Endpoint**
```
http://localhost:8000/health
```
Quick way to verify backend is running. Should show: `{"status": "ok"}`

**Tip 2: Check API Docs**
```
http://localhost:8000/docs
```
Interactive Swagger UI to test endpoints manually

**Tip 3: Use Browser Console (F12)**
```
Console tab shows detailed error messages
Network tab shows all API calls and responses
```

**Tip 4: Export Results**
```
After getting results, click "Export Results" to save CSV
```

---

## 🎉 You're All Set!

Everything is ready to go. The corrected code handles all error cases gracefully. No more generic error messages - users will know exactly what went wrong and how to fix it.

---

**Version**: 2.0 (Enhanced)  
**Date**: February 20, 2026  
**Status**: ✅ Production Ready
