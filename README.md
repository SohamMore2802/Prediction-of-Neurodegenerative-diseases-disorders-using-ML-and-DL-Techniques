# 🧠 NeuroCognitive Insights: Advanced Analytics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)

**NeuroCognitive Insights** is a feature-rich, full-stack analytics platform designed to assist in the prediction and diagnosis of neurodegenerative and neurocognitive disorders using Machine Learning. It provides a professional, clinical-grade interface for assessing risks associated with Alzheimer's, Parkinson's, ALS, and Huntington's disease.

---

## ✨ Key Features

- 🔐 **Secure Authentication**: Complete registration and login system with SHA-256 password hashing.
- 📊 **Disease Workspaces**: Dedicated assessment modules for Alzheimer's, Parkinson's, ALS, and Huntington's.
- 🤖 **ML-Driven Predictions**: Backend integrated with diagnostic models to provide risk scores and clinical insights.
- 🎨 **Premium UI/UX**: Modern, responsive dashboard built with a focus on usability and professional aesthetics.
- 📝 **Comprehensive Reports**: Detailed assessment history and personalized user data management.
- 🔌 **RESTful API**: Robust FastAPI backend with automatic Swagger/OpenAPI documentation.

---

## 🏗️ Project Architecture

```text
R&I/
├── backend/                # FastAPI Application
│   ├── main.py             # API endpoints and core logic
│   └── ...                 
├── frontend/               # Web Interface
│   ├── index.html          # Main landing page
│   ├── auth.html           # Login/Registration
│   ├── als.html            # ALS workspace
│   ├── parkinsons.html     # Parkinson's workspace
│   ├── alzheimers.html     # Alzheimer's workspace
│   ├── huntington.html     # Huntington's workspace
│   ├── app.js              # Frontend logic (Auth & API calls)
│   └── styles.css          # Professional styling
├── docs/                   # Detailed documentation (MD files)
├── start-dev.bat           # Windows quick-start script
└── requirements.txt        # Python dependencies
```

---

## 🛠️ Tech Stack

- **Backend**: Python, FastAPI, Uvicorn (ASGI server)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Storage**: JSON-based persistent storage (can be scaled to SQL)
- **Security**: SHA-256 hashing, Session management via LocalStorage

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- Windows/macOS/Linux

### Quick Start (Windows)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neurocognitive-insights.git
   cd neurocognitive-insights
   ```
2. Simply double-click **`start-dev.bat`**. This will:
   - Create a virtual environment (if not present).
   - Install all required dependencies.
   - Start both the Backend and Frontend servers automatically.
3. Open your browser to: **`http://localhost:8080`**

### Manual Setup (All Platforms)

1. **Setup Backend**:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r ../requirements.txt
   uvicorn main:app --reload --port 8000
   ```

2. **Setup Frontend**:
   ```bash
   # In a new terminal
   cd frontend
   python -m http.server 8080
   ```

3. **Access the App**:
   Visit `http://localhost:8080` and log in (or register) to start using the workspaces.

---

## 🔌 API Documentation

Once the backend is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 🛡️ Security & Privacy

- **Data Safety**: All local data is stored securely. Passwords are never stored as plaintext.
- **Modularity**: The system is designed to be decoupled; you can easily swap the local JSON storage for a production-grade PostgreSQL or MongoDB instance.

---

## 🗺️ Roadmap

- [ ] **JWT Integration**: Upgrade to JSON Web Tokens for enhanced session security.
- [ ] **PDF Export**: Generate professional clinical reports for each assessment.
- [ ] **Cloud Deployment**: Dockerize the application for easy deployment to AWS/Heroku.
- [ ] **Real-time Visualization**: Add Chart.js or D3.js for interactive patient data trends.

---

## 📞 Support & Documentation

For detailed information on specific components, please refer to the files in the project root:
- `PROJECT_STRUCTURE.md`: High-level architecture overview.
- `LOGIN_REGISTRATION_GUIDE.md`: Deep dive into the auth system.
- `GETTING_STARTED.md`: Detailed setup and troubleshooting.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed for the PBL II MP NeuroCognitive Insights Project.** 🚀
