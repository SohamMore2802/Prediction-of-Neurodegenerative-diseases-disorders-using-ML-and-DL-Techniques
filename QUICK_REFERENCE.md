# Quick Reference - Login & Registration

## 🚀 Quick Start (Windows)
1. Double-click `start-dev.bat` 
2. Wait for two terminal windows to open
3. Open browser to `http://localhost:8080`
4. Click "Login / Register"

## 🚀 Quick Start (Mac/Linux)
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
python -m http.server 8080 -d frontend
```
Then open `http://localhost:8080`

## 📝 Registration
- Click "Register" tab
- Fill in: Full Name, Email, Password (8+ chars), Confirm Password
- Accept Terms
- Click "Register"
- Success message appears
- Auto-redirects to login

## 🔓 Login
- Enter Email and Password
- Optional: Check "Remember me" to save email
- Click "Login"
- Redirected to home page
- Header shows: "Welcome, [Your Name]"
- New "Logout" button appears

## 🔐 Logout
- Click "Logout" button in header
- Returns to login page
- Session cleared

## 📁 Key Files

**Frontend:**
- `frontend/auth.html` - Login/Register page
- `frontend/app.js` - Auth logic (checkAuth, logout functions)
- `frontend/index.html` - Updated with auth header
- `frontend/styles.css` - Auth styling

**Backend:**
- `backend/main.py` - New `/auth/register` and `/auth/login` endpoints

**Data:**
- `users.json` - User database (auto-created, don't edit manually)

## 🔌 API Endpoints

**Register User**
```
POST /auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login User**
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "hashed_token_string",
  "user": {
    "email": "john@example.com",
    "full_name": "John Doe"
  },
  "message": "Login successful"
}
```

## 💾 Data Storage
- Users: `users.json` (JSON format)
- Sessions: Browser `localStorage`
- Assessment History: Browser `localStorage`

## 🛠️ Troubleshooting

**"Network error"**
- Backend server not running
- Check terminal 1 is showing "Uvicorn running"

**"Invalid email or password"**
- Email doesn't exist (must register first)
- Password is incorrect
- Check caps lock

**"Email already registered"**
- Use different email
- Or click "Login" tab if already have account

**"Two servers won't start"**
- Ports 8000 or 8080 already in use
- Change ports in `start-dev.bat`
- Or close other apps using those ports

## 📊 Testing the System
1. Register account: `test@example.com` / `password123`
2. Login with those credentials
3. See "Welcome, Test" in header
4. Click on disease workspace (Alzheimer's, etc.)
5. Fill form and submit assessment
6. Click "Logout" to test session clear

## 🔄 Session Persistence
- Page refresh: Session stays active ✅
- Close browser: Session lost (unless "Remember me" checked) ⚠️
- "Remember me": Email saved, still need password on login ✅
- New browser: Session lost 📱

## 🎨 Customization

**Change color scheme:**
- Edit `auth.html` style section
- Colors: `#667eea` (purple), `#764ba2` (dark purple)

**Change password requirements:**
- Edit `frontend/auth.html` - line with `min. 8 characters`
- Edit `backend/main.py` - `min_length=8` in RegisterRequest

**Change token expiration:**
- Currently no expiration (demo mode)
- See "Security Notes" in LOGIN_REGISTRATION_GUIDE.md for production setup

## ✨ Features
- ✅ User registration
- ✅ User login  
- ✅ Password hashing
- ✅ Session management
- ✅ "Remember me" checkbox
- ✅ Personalized greeting
- ✅ Logout
- ✅ Form validation
- ✅ Error messages
- ✅ Responsive design

---
**Everything is set up and ready to go!**
