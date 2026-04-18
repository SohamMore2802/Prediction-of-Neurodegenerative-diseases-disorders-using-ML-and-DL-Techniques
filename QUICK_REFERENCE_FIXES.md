# Quick Reference: Corrected Code for All 4 Diseases

## 🎯 Single JavaScript File Covers All 4 Diseases

All 4 disease/disorder pages use the same enhanced `app.js` file:
- ✅ `alzheimers.html` → uses `app.js`
- ✅ `parkinsons.html` → uses `app.js`
- ✅ `als.html` → uses `app.js`
- ✅ `huntington.html` → uses `app.js`

---

## 📝 Key Code Sections in app.js

### 1. Configuration (Lines 1-4)
```javascript
const API_BASE_URL = "http://localhost:8000";
const API_TIMEOUT = 15000; // 15 second timeout
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second between retries
```

### 2. Server Health Check (Lines 21-32)
```javascript
async function checkServerHealth() {
  try {
    const response = await Promise.race([
      fetch(`${API_BASE_URL}/health`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Server health check timeout")), 5000)
      ),
    ]);
    return response.ok;
  } catch (err) {
    return false;
  }
}
```

### 3. Payload Validation (Lines ~160-195)
```javascript
function validatePayload(payload) {
  const errors = [];
  // Checks all required fields
  // Returns array of validation errors
}
```

### 4. Fetch with Retry Logic (Lines ~197-250)
```javascript
async function fetchWithRetry(url, options, retryCount = 0) {
  try {
    // 15-second timeout
    // Handle different error types
    // Retry on network errors (max 3 times)
    // Return response
  } catch (err) {
    // Detailed error handling
  }
}
```

### 5. Error Display with Retry (Lines ~252-310)
```javascript
function displayError(errorMessage, retryCallback = null) {
  // Shows user-friendly error UI
  // Displays troubleshooting steps
  // Adds retry button
}
```

### 6. Enhanced Form Submission (Lines ~312-370)
```javascript
async function submitForm(event) {
  // Prevents double submission
  // Validates payload
  // Checks server health
  // Makes API call with retry
  // Handles all error cases
  // Displays results or errors
}
```

---

## 🧪 Testing Checklist for All 4 Diseases

### Test 1: Alzheimer's Disease
1. Open: `http://localhost:8080/alzheimers.html`
2. Fill in:
   - Age: 72
   - Sex: Female
   - ELISA Biomarker 1: 1.6
   - ELISA Biomarker 2: 0.9
   - Cognitive Score: 21.5
   - MRI Severity: 0.65
   - ECG/EEG Anomaly: 0.30
3. Click "Run Alzheimer's Assessment"
4. Should see: Risk score and level

### Test 2: Parkinson's Disease
1. Open: `http://localhost:8080/parkinsons.html`
2. Fill in:
   - Age: 68
   - Sex: Male
   - ELISA Biomarker 1: 1.2
   - ELISA Biomarker 2: 0.85
   - Cognitive Score: 28
   - MRI Severity: 0.55
   - ECG/EEG Anomaly: 0.45
3. Click "Run Parkinson's Assessment"
4. Should see: Risk score and level

### Test 3: ALS (Motor Neuron Disease)
1. Open: `http://localhost:8080/als.html`
2. Fill in:
   - Age: 60
   - Sex: Other
   - ELISA Biomarker 1: 1.1
   - ELISA Biomarker 2: 0.75
   - Cognitive Score: 32
   - MRI Severity: 0.48
   - ECG/EEG Anomaly: 0.38
3. Click "Run ALS Assessment"
4. Should see: Risk score and level

### Test 4: Huntington's Disease
1. Open: `http://localhost:8080/huntington.html`
2. Fill in:
   - Age: 50
   - Sex: Female
   - ELISA Biomarker 1: 1.3
   - ELISA Biomarker 2: 0.95
   - Cognitive Score: 25
   - MRI Severity: 0.62
   - ECG/EEG Anomaly: 0.52
3. Click "Run Huntington's Assessment"
4. Should see: Risk score and level

---

## 🔴 Test Error Handling

### Test 5: Invalid Input Validation
1. Leave Age blank
2. Click submit
3. Should see: "Age must be between 18 and 120"

### Test 6: Server Down Handling
1. Stop the backend server (Ctrl+C)
2. Try to submit assessment
3. Should see: Error message with troubleshooting steps
4. Start server again
5. Click "Retry Assessment"
6. Should work!

### Test 7: Timeout Handling
1. Modify backend to be very slow (add delay)
2. Try to submit
3. After 15 seconds: Should see timeout error
4. Click "Retry Assessment"

---

## 📊 API Endpoint Details

### Health Check Endpoint
```
GET http://localhost:8000/health
Response: {"status": "ok"}
```

### Prediction Endpoint (All 4 Diseases)
```
POST http://localhost:8000/predict
Content-Type: application/json

Request:
{
  "age": 72,                        // 18-120
  "sex": "female",                  // "male"|"female"|"other"
  "disorder_type": "alzheimers",    // "alzheimers"|"parkinsons"|"als"|"huntington"
  "elisa_biomarker_1": 1.6,        // >= 0
  "elisa_biomarker_2": 0.9,        // >= 0
  "cognitive_score": 21.5,          // 0-100
  "mri_severity_score": 0.65,       // 0-1
  "ecg_eeg_anomaly_score": 0.30    // 0-1
}

Response:
{
  "risk_score": 0.72,
  "risk_level": "high",
  "summary": "Estimated Alzheimers risk is **HIGH** with score 0.72.",
  "details": {
    "inputs": { ... },
    "interpretable_terms": { ... }
  }
}
```

---

## ⚠️ Common Errors and Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot connect to backend server" | Server not running | Start: `python backend/main.py` |
| "Request timeout" | Server too slow | Restart server, check system load |
| "Age must be between 18 and 120" | Invalid age input | Enter age between 18-120 |
| "HTTP 500: Internal Server Error" | Backend crash | Check backend console, restart |
| "HTTP 422: Validation Error" | Invalid data format | Check all numbers are correct type |
| Form won't submit after error | State locked | Refresh page or clear browser cache |

---

## 🔍 Debug Mode

To see detailed API responses:

1. With any form filled, click "Show Model Details"
2. You'll see the full JSON response structure
3. Useful for understanding the risk calculation

---

## 📱 Browser Developer Tools

To debug further:

1. Press `F12` to open Developer Tools
2. Go to "Console" tab
3. Look for error messages
4. Check "Network" tab to see API calls
5. Look for "all-fields" in the request payload

---

## ✨ Features Included

✅ **No double-submission** - Button disabled during request
✅ **15-second timeout** - Prevents hanging indefinitely
✅ **3 automatic retries** - Recovers from temporary failures
✅ **Input validation** - Catches errors before sending
✅ **Health check** - Verifies server is alive first
✅ **User-friendly errors** - Shows what went wrong
✅ **Troubleshooting guide** - Shows how to fix issues
✅ **Retry button** - Easy recovery from errors
✅ **Console logging** - Details for debugging
✅ **Response validation** - Ensures valid data from backend

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start everything at once
start-dev.bat

# 3. Open frontend
http://localhost:8080

# 4. Choose a disease page and test!
```

---

**Last Updated:** February 20, 2026
