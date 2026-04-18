# 🎉 Getting Started with Login & Registration

Welcome! Your website now has a complete authentication system. Here's how to get it running in 2 minutes.

## ⚡ Quick Start

### For Windows Users (Easiest)
1. Open the workspace folder
2. Double-click **`start-dev.bat`**
3. Two terminal windows will open automatically
4. Open browser to **`http://localhost:8080`**
5. Click "Login / Register" button and test! ✅

### For Mac/Linux Users
Open two terminals in the workspace folder:

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
python -m http.server 8080 -d frontend
```

Then open: **`http://localhost:8080`**

---

## 🧪 Test the System (2 minutes)

### 1️⃣ Register an Account
1. Click "Login / Register" button in header
2. Click "Register" tab
3. Fill in:
   - **Full Name:** `John Doe`
   - **Email:** `test@example.com`
   - **Password:** `password123`
   - **Confirm Password:** `password123`
4. Check "I agree to Terms and Conditions"
5. Click "Register" button
6. See ✅ Success message

### 2️⃣ Login with Credentials
1. Click "Login" tab
2. Enter:
   - **Email:** `test@example.com`
   - **Password:** `password123`
3. Check "Remember me" (optional)
4. Click "Login" button
5. ✅ You're logged in!
6. See **"Welcome, John Doe"** in header
7. **"Logout"** button appears

### 3️⃣ Access Disease Workspaces
1. Click on any disease (Alzheimer's, Parkinson's, etc.)
2. Fill in patient assessment form
3. Click "Run ML Assessment"
4. See risk score and recommendations
5. Assessment history saved ✅

### 4️⃣ Logout
1. Click "Logout" button in header
2. ✅ Redirected to login page
3. Session cleared

---

## 📂 What's New

| File | What It Does |
|------|--------------|
| **auth.html** | Beautiful login/registration page |
| **users.json** | Stores user accounts (created automatically) |
| **app.js** | Updated with authentication logic |
| **index.html** | Updated with login button in header |
| **main.py** | Updated with login/register backend endpoints |

---

## 💡 How It Works

```
1. User registers with email + password
   └─> Backend hashes password & saves to users.json

2. User logs in with credentials  
   └─> Backend verifies & returns authentication token
   └─> Browser stores in localStorage

3. User stays logged in
   └─> "Welcome, [Name]" shows in header
   └─> Logout button available
   └─> Assessment history tracked

4. User logs out
   └─> localStorage cleared
   └─> Redirected to login page
```

---

## 🔐 Your Credentials

After registration, you can login with:
- **Email:** Whatever you registered with
- **Password:** Whatever you set

**Example test account:**
- Email: `test@example.com`
- Password: `password123`

---

## 📚 Documentation

For more details, see:
- **QUICK_REFERENCE.md** - Quick lookup guide
- **LOGIN_REGISTRATION_GUIDE.md** - Detailed setup guide
- **PROJECT_STRUCTURE.md** - Architecture overview
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

---

## ❓ Common Questions

**Q: Do I need to install anything?**  
A: Just run `start-dev.bat` (Windows) or the terminal commands (Mac/Linux). Dependencies install automatically.

**Q: Where are users stored?**  
A: In `users.json` file. Auto-created on first registration.

**Q: Is this secure?**  
A: For demo/testing yes. For production, see "Security Notes" in LOGIN_REGISTRATION_GUIDE.md

**Q: Can I reset password?**  
A: Not yet. You can delete entry from `users.json` and re-register.

**Q: Can I customize the colors?**  
A: Yes! Edit `frontend/auth.html` CSS section to change gradient colors.

**Q: Will my session stay if I refresh?**  
A: Yes! Session stored in browser localStorage.

**Q: What if I close browser?**  
A: Session is lost (unless you save session to a database in future).

**Q: How do I test on mobile?**  
A: Use your computer's IP address: `http://<your-ip>:8080`

---

## ✅ Verification Checklist

After starting the servers, verify everything works:

- [ ] Backend running at `http://localhost:8000` ✅
- [ ] Frontend running at `http://localhost:8080` ✅
- [ ] Can see "Login / Register" button ✅
- [ ] Can register new account ✅
- [ ] Can login with credentials ✅
- [ ] Can see personalized greeting ✅
- [ ] Can access disease workspaces ✅
- [ ] Can run assessments ✅
- [ ] Can logout ✅

---

## 🆘 Troubleshooting

**Problem: Can't see website**  
→ Check: Backend on `:8000`, Frontend on `:8080`, ports not in use

**Problem: "Network error" on login**  
→ Check: Backend server is running, see "Uvicorn running" in terminal

**Problem: Can't register**  
→ Check: Password is 8+ characters, email not already registered

**Problem: Can't login**  
→ Check: Email exists (must register first), password is correct

**Problem: Port already in use**  
→ Solution: Close other apps or change port in `start-dev.bat`

---

## 🎯 Next Steps

1. ✅ **Test registration/login** - Try the test flow above
2. ✅ **Explore workspaces** - Try Alzheimer's, Parkinson's, etc.
3. ✅ **Run assessments** - Submit patient data
4. ✅ **Check history** - See previous assessments
5. ✅ **Customize** - Change colors, add features

---

## 📞 Need Help?

1. Check **QUICK_REFERENCE.md** for common tasks
2. Check **LOGIN_REGISTRATION_GUIDE.md** for detailed info
3. Look at **PROJECT_STRUCTURE.md** for architecture
4. Check browser console for errors: `F12` → Console tab

---

## 🚀 You're All Set!

Your website now has a complete authentication system. Users can:
- ✅ Register accounts
- ✅ Login securely
- ✅ See personalized greeting
- ✅ Access disease workspaces
- ✅ Track assessment history
- ✅ Logout anytime

**Everything is ready to go! Start the servers and test it out! 🎉**

---

**Questions? Check the documentation files or test the system yourself!**
