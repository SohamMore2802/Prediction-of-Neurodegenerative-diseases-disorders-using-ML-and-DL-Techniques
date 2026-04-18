from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import json
import os
from datetime import datetime
import hashlib


# User database file (for demo purposes)
USERS_DB_FILE = "users.json"


def load_users_db():
    """Load users from JSON file."""
    if os.path.exists(USERS_DB_FILE):
        with open(USERS_DB_FILE, "r") as f:
            return json.load(f)
    return {}


def save_users_db(users):
    """Save users to JSON file."""
    with open(USERS_DB_FILE, "w") as f:
        json.dump(users, f, indent=2)


def hash_password(password: str) -> str:
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


class RegisterRequest(BaseModel):
    """User registration request."""
    full_name: str = Field(..., min_length=2, description="Full name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")


class LoginRequest(BaseModel):
    """User login request."""
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")


class AuthResponse(BaseModel):
    """Authentication response."""
    token: str
    user: dict
    message: str


class NeuroPredictionRequest(BaseModel):
    """Input payload for neurodegenerative / neurocognitive risk scoring."""

    age: int = Field(..., ge=18, le=120, description="Age in years")
    sex: Literal["male", "female", "other"] = Field(
        ..., description="Biological sex (simplified)"
    )
    disorder_type: Literal[
        "alzheimers",
        "parkinsons",
        "als",
        "huntington",
        "mci",
        "other_neurodegenerative",
    ] = Field(..., description="Primary suspected disorder type")

    # Example quantitative markers – these are domain-agnostic placeholders
    elisa_biomarker_1: float = Field(
        ..., description="Normalized ELISA biomarker (e.g. Aβ42, α-synuclein)", ge=0.0
    )
    elisa_biomarker_2: float = Field(
        ..., description="Normalized ELISA biomarker (e.g. tau, p-tau)", ge=0.0
    )
    cognitive_score: float = Field(
        ..., description="Cognitive screening score (e.g. MMSE, MoCA)", ge=0.0, le=100
    )

    # Imaging-derived features (e.g. from MRI and ECG/EEG models)
    mri_severity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description=(
            "MRI-based severity score between 0 and 1 (e.g. output from a radiology ML model)."
        ),
    )
    ecg_eeg_anomaly_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description=(
            "ECG/EEG anomaly score between 0 and 1 (e.g. output from a signal-processing model)."
        ),
    )


class NeuroPredictionResponse(BaseModel):
    risk_score: float = Field(
        ..., ge=0.0, le=1.0, description="Model risk score between 0 and 1"
    )
    risk_level: Literal["low", "moderate", "high"]
    summary: str
    details: dict


app = FastAPI(
    title="NeuroCognitive ML Service",
    description=(
        "Backend service for predicting and summarizing neurodegenerative / "
        "neurocognitive disorder risk using statistical and ML-inspired heuristics.\n\n"
        "NOTE: This is a demonstration service and **not** a medical device."
    ),
    version="0.1.0",
)

# Allow calls from any origin for now (simple local dev frontends)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    """Lightweight liveness and readiness probe."""
    return {"status": "ok"}


# Authentication endpoints
@app.post("/auth/register", tags=["authentication"])
def register(request: RegisterRequest) -> dict:
    """Register a new user."""
    users = load_users_db()
    
    # Check if user already exists
    if request.email in users:
        return {
            "detail": "Email already registered. Please login or use a different email."
        }
    
    # Store user
    users[request.email] = {
        "full_name": request.full_name,
        "email": request.email,
        "password": hash_password(request.password),
        "created_at": datetime.now().isoformat()
    }
    
    save_users_db(users)
    
    return {
        "message": "Registration successful",
        "email": request.email
    }


@app.post("/auth/login", tags=["authentication"])
def login(request: LoginRequest) -> dict:
    """Login user and return token."""
    users = load_users_db()
    
    if request.email not in users:
        return {
            "detail": "Invalid email or password"
        }
    
    user = users[request.email]
    
    # Verify password
    if user["password"] != hash_password(request.password):
        return {
            "detail": "Invalid email or password"
        }
    
    # Generate token (simple token for demo - use JWT in production)
    token = hash_password(f"{request.email}{datetime.now().isoformat()}")
    
    return {
        "token": token,
        "user": {
            "email": user["email"],
            "full_name": user["full_name"]
        },
        "message": "Login successful"
    }


def _base_risk_from_disorder(disorder_type: str) -> float:
    """Simple prior based on disorder type selection."""
    priors = {
        "alzheimers": 0.4,
        "parkinsons": 0.35,
        "als": 0.38,
        "huntington": 0.42,
        "mci": 0.3,
        "other_neurodegenerative": 0.25,
    }
    return priors.get(disorder_type, 0.2)


def _logistic(x: float) -> float:
    """Numerically stable logistic mapping to (0, 1)."""
    import math

    # clamp to avoid overflow in extreme cases
    x = max(min(x, 20.0), -20.0)
    return 1.0 / (1.0 + math.exp(-x))


def _compute_risk(req: NeuroPredictionRequest) -> NeuroPredictionResponse:
    """
    Domain-agnostic heuristic "model".

    This is intentionally simple and transparent so you can later swap it with a
    real trained model exported from your notebooks.
    """
    # Normalize / scale example features
    age_term = (req.age - 60) / 20.0  # centered around 60
    biomarker_term = (req.elisa_biomarker_1 + req.elisa_biomarker_2) / 2.0
    cognitive_term = (50.0 - req.cognitive_score) / 25.0  # lower scores => higher risk
    imaging_term = 0.7 * req.mri_severity_score + 0.6 * req.ecg_eeg_anomaly_score

    prior = _base_risk_from_disorder(req.disorder_type)

    # Very simple linear model before logistic squashing
    z = (
        -1.0
        + 1.2 * prior
        + 0.8 * age_term
        + 1.0 * biomarker_term
        + 0.9 * cognitive_term
        + 0.8 * imaging_term
    )

    raw_score = _logistic(z)

    # Clip defensively
    risk_score = max(0.0, min(1.0, raw_score))

    if risk_score < 0.33:
        risk_level = "low"
    elif risk_score < 0.66:
        risk_level = "moderate"
    else:
        risk_level = "high"

    summary = (
        f"Estimated {req.disorder_type.replace('_', ' ').title()} "
        f"risk is **{risk_level.upper()}** with score {risk_score:.2f}."
    )

    details = {
        "inputs": {
            "age": req.age,
            "sex": req.sex,
            "disorder_type": req.disorder_type,
            "elisa_biomarker_1": req.elisa_biomarker_1,
            "elisa_biomarker_2": req.elisa_biomarker_2,
            "cognitive_score": req.cognitive_score,
            "mri_severity_score": req.mri_severity_score,
            "ecg_eeg_anomaly_score": req.ecg_eeg_anomaly_score,
        },
        "interpretable_terms": {
            "age_term": age_term,
            "biomarker_term": biomarker_term,
            "cognitive_term": cognitive_term,
            "imaging_term": imaging_term,
            "prior_from_disorder": prior,
        },
    }

    return NeuroPredictionResponse(
        risk_score=risk_score,
        risk_level=risk_level,
        summary=summary,
        details=details,
    )


@app.post("/predict", response_model=NeuroPredictionResponse, tags=["prediction"])
def predict(request: NeuroPredictionRequest) -> NeuroPredictionResponse:
    """
    Compute an illustrative risk score.

    Replace `_compute_risk` with your real ML model logic from the notebooks
    (e.g. load a pickled scikit-learn model and call `model.predict_proba`).
    """
    return _compute_risk(request)


if __name__ == "__main__":
    import uvicorn
    import os
    
    # Disable reload for Windows compatibility
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False
    )

