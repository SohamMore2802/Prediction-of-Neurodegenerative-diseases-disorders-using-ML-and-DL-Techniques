# Backend API Error - Complete Fix Guide

## 🎯 What Was Fixed

Your frontend code had insufficient error handling when communicating with the FastAPI backend. This guide explains all the improvements and how to properly set up your system.

---

## ✅ Improvements Made to Frontend (`app.js`)

### 1. **Added Server Health Check**
```javascript
async function checkServerHealth()
```
- Checks if the backend server is alive before attempting predictions
- Prevents hanging requests when server is down
- 5-second timeout on health check

### 2. **Added Request Validation**
```javascript
function validatePayload(payload)
```
- Validates all form inputs before sending to server
- Checks data types, ranges, and required fields
- Provides specific error messages for each field

### 3. **Enhanced Error Handling**
```javascript
function displayError(errorMessage, retryCallback)
```
- Beautiful error UI with troubleshooting steps
- Shows real error messages from backend
- Includes a "Retry" button for recovery
- Displays step-by-step troubleshooting guide

### 4. **Implemented Timeout Protection**
- 15-second timeout on all API requests
- Prevents infinite hanging
- Clear timeout error message

### 5. **Added Retry Logic**
```javascript
async function fetchWithRetry()
```
- Automatically retries on network errors (up to 3 times)
- Exponential backoff between retries
- Doesn't retry on validation errors (faster feedback)

### 6. **Better Error Messages**
- Shows actual server error details
- Displays HTTP status codes
- Provides troubleshooting suggestions
- Logs errors to browser console for debugging

### 7. **Added Submit Prevention**
- Prevents double-submission of forms
- Disables submit button during request
- Only re-enables when request completes

---

## 🚀 How to Use the Fixed Code

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Backend Server
**Option A: Using the batch file (Windows)**
```bash
start-dev.bat
```

**Option B: Manual startup**
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Verify Backend is Running
Open this URL in your browser:
```
http://localhost:8000/health
```

You should see:
```json
{"status": "ok"}
```

### Step 4: View API Documentation
Open this in your browser:
```
http://localhost:8000/docs
```

### Step 5: Start the Frontend
**Option A: Using the batch file**
```bash
start-dev.bat
```

**Option B: Manual startup**
```bash
cd frontend
python -m http.server 8080
```

Then open:
```
http://localhost:8080
```

---

## 🔍 Troubleshooting

### Error: "Cannot connect to backend server"
**Solution:**
1. Check if server is running: `http://localhost:8000/health`
2. If not running, start it: `python backend/main.py`
3. Wait 2-3 seconds for startup
4. Click "Retry Assessment"

### Error: "Request timeout (server took too long to respond)"
**Solution:**
1. Backend may be overloaded
2. Check your input values and reduce complexity
3. Restart the backend server
4. Try again with smaller dataset
5. Click "Retry Assessment"

### Error: "HTTP 422: Validation Error"
**Solution:**
1. You're sending invalid data
2. Check all form fields are filled
3. Age must be 18-120
4. Cognitive score must be 0-100
5. MRI and ECG scores must be 0-1

### Error: "HTTP 500: Internal Server Error"
**Solution:**
1. Backend server has an error
2. Check backend terminal for error messages
3. Restart the backend: `Ctrl+C` then run again
4. Check `backend/main.py` for syntax errors

### CORS Error (Access denied from different origin)
**Solution:**
- This is already fixed in `backend/main.py`
- CORS middleware is configured for all origins
- Should not occur with this setup

---

## 📋 All 4 Diseases/Disorders Covered

All four disease pages have been tested and can use the corrected code:

1. **Alzheimer's Disease** (`alzheimers.html`)
   - Biomarkers: Aβ42, tau, p-tau
   - Imaging: Cortical atrophy via MRI

2. **Parkinson's Disease** (`parkinsons.html`)
   - Biomarkers: α-synuclein, complementary markers
   - Imaging: ECG, motor features via EEG

3. **ALS (Amyotrophic Lateral Sclerosis)** (`als.html`)
   - Biomarkers: Motor neuron markers
   - Imaging: MRI of spinal cord

4. **Huntington's Disease** (`huntington.html`)
   - Biomarkers: Huntingtin-related markers
   - Imaging: Striatal atrophy via MRI

All use the same corrected API endpoint: `POST /predict`

---

## 🔧 Backend Configuration

### CORS Settings (`backend/main.py`)
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
✅ Allows all origins (safe for local development)

### Health Check Endpoint
```
GET http://localhost:8000/health
Response: {"status": "ok"}
```

### Prediction Endpoint
```
POST http://localhost:8000/predict
Content-Type: application/json

Request Body: {
  "age": int (18-120),
  "sex": "male"|"female"|"other",
  "disorder_type": "alzheimers"|"parkinsons"|"als"|"huntington",
  "elisa_biomarker_1": float (>= 0),
  "elisa_biomarker_2": float (>= 0),
  "cognitive_score": float (0-100),
  "mri_severity_score": float (0-1),
  "ecg_eeg_anomaly_score": float (0-1)
}

Response: {
  "risk_score": float (0-1),
  "risk_level": "low"|"moderate"|"high",
  "summary": string,
  "details": {
    "inputs": {...},
    "interpretable_terms": {...}
  }
}
```

---

## 📊 Frontend File Structure

```
frontend/
├── index.html              # Home page
├── alzheimers.html        # Alzheimer's assessment page
├── parkinsons.html        # Parkinson's assessment page
├── als.html               # ALS assessment page
├── huntington.html        # Huntington's assessment page
├── auth.html              # Login/Registration page
├── app.js                 # 🎯 ENHANCED - Main application logic
├── export-history.js      # Export functionality
└── styles.css             # Styling
```

---

## 🎓 Key Features

✅ **Timeout Protection** - 15-second timeout prevents hanging
✅ **Auto-Retry** - 3 automatic retries with exponential backoff
✅ **Input Validation** - Catches errors before sending to server
✅ **Health Check** - Verifies server is alive
✅ **User-Friendly Errors** - Clear messages with troubleshooting steps
✅ **Retry Button** - Users can easily retry after fixing issues
✅ **Console Logging** - Detailed error logs for debugging
✅ **Submit Prevention** - Avoid double-submission
✅ **Response Validation** - Ensures backend responses are valid

---

## 🚨 Code Changes Summary

### `app.js` - Total Changes:
- Added 4 new configuration constants
- Added `checkServerHealth()` function
- Added `validatePayload()` function
- Added `fetchWithRetry()` function with timeout
- Improved `setLoading()` with submission state tracking
- Added `displayError()` with retry functionality
- Completely rewrote `submitForm()` with detailed error handling
- Added comprehensive error messages

### Backend - No Changes Required
✅ `backend/main.py` is already correctly configured
✅ All endpoints are working properly
✅ CORS is properly configured

---

## ⚡ Quick Test

1. **Start both servers:**
   ```bash
   start-dev.bat
   ```

2. **Check health:**
   ```
   http://localhost:8000/health
   ```

3. **Open any disease page:**
   ```
   http://localhost:8080/alzheimers.html
   ```

4. **Fill in test data:**
   - Age: 72
   - Sex: Female
   - ELISA Biomarker 1: 1.6
   - ELISA Biomarker 2: 0.9
   - Cognitive Score: 21.5
   - MRI Severity: 0.65
   - ECG/EEG Anomaly: 0.30

5. **Click "Run ML Assessment"**

6. **You should see results!** If not, check the error message and troubleshooting steps

---

## 📞 Support

If you still encounter issues:

1. Check the browser console (F12 → Console tab)
2. Review the troubleshooting steps in error dialog
3. Verify backend is running on http://localhost:8000/health
4. Check that port 8000 is not in use by another application
5. Restart both servers

---

**Last Updated:** February 20, 2026
