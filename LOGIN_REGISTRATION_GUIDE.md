# Login & Registration System - Setup Guide

## Overview
I've added a complete login and registration system to your NeuroCognitive Insights website. Users can now register new accounts and log in before accessing the disease assessment workspaces.

## What Was Added

### 1. **Frontend Changes**

#### New Auth Page (`frontend/auth.html`)
- Beautiful login/registration interface with tab switching
- Form validation for email and passwords
- Password confirmation for registration
- "Remember me" checkbox for login
- Success/error message displays
- Responsive design with gradient background

#### Updated Index (`frontend/index.html`)
- Added login button in header
- Displays user's name when logged in
- Logout button for authenticated users

#### Updated Styles (`frontend/styles.css`)
- New styles for authentication buttons
- Header authentication section styling

#### Updated App Script (`frontend/app.js`)
- `checkAuth()` function - checks if user is logged in and updates UI
- `logout()` function - logs out user and clears data
- Auto-loads user info on page load

### 2. **Backend Changes**

#### New Authentication Endpoints (`backend/main.py`)

**POST `/auth/register`**
- Creates new user account
- Validates email and password
- Stores user with hashed password in JSON file
- Returns success/error message

**POST `/auth/login`**
- Authenticates user credentials
- Returns authentication token and user info
- Validates email and password

#### User Database
- Users stored in `users.json` (auto-created)
- Passwords hashed with SHA-256
- Simple but functional for demo purposes

### 3. **File Structure**
```
frontend/
├── auth.html          (NEW - Login/Registration page)
├── index.html         (UPDATED - Added header auth section)
├── app.js             (UPDATED - Authentication logic)
├── styles.css         (UPDATED - Auth styling)
└── [other files]

backend/
├── main.py            (UPDATED - Added auth endpoints)
└── [other files]

users.json            (CREATED on first registration)
```

## How It Works

### Registration Flow
1. User visits `auth.html`
2. Clicks "Register" tab
3. Fills in full name, email, password, confirm password
4. Clicks "Register" button
5. Backend creates new user and returns success
6. User can then login with credentials

### Login Flow
1. User visits `auth.html`
2. Enters email and password
3. Optionally checks "Remember me"
4. Clicks "Login" button
5. Backend validates credentials and returns token + user info
6. User is redirected to `index.html`
7. Header shows "Welcome, [Name]" and logout button

### Authentication State
- Token and user info stored in `localStorage`
- Persists across page refreshes
- "Remember me" saves user email for next visit
- Logout clears all authentication data

## Getting Started

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Backend Server
```bash
cd backend
python main.py
```
Server runs on `http://localhost:8000`

### 3. Open Frontend
- Open `frontend/index.html` in a web browser
- Or use a local web server:
  ```bash
  python -m http.server 8080 -d frontend
  ```
- Then visit `http://localhost:8080`

### 4. Test the System
1. Click "Login / Register" button
2. Register a new account
3. Login with the credentials
4. You'll see personalized greeting in header
5. Access disease workspaces
6. Click "Logout" to clear session

## Test Credentials
After registering, you can use any email/password combination (password must be 8+ characters).

Example test account:
- Email: `test@example.com`
- Password: `password123`

## Security Notes
- **Demo Purpose**: This uses simple SHA-256 hashing
- **Production**: Should use proper JWT tokens and bcrypt
- **Password Reset**: Not yet implemented
- **HTTPS**: Required for production
- **CORS**: Currently allows all origins (change in production)

## Features
✅ User Registration  
✅ User Login  
✅ Password Hashing  
✅ Session Management  
✅ Remember Me  
✅ User Greeting  
✅ Logout Functionality  
✅ Form Validation  
✅ Error Handling  
✅ Responsive Design  

## Next Steps (Optional)
1. Implement JWT tokens for better security
2. Add password reset functionality
3. Add email verification
4. Store users in a proper database (SQLite, PostgreSQL)
5. Add user profile page
6. Store assessment history per user

---

**Everything is ready to use! Just run the backend server and open the frontend in your browser.**
