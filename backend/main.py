"""
QueueSense - Production FastAPI Backend Service
Serves ML inference endpoints and static React frontend application.
"""

import os
import sys
import json
import time
import types
from datetime import datetime
from typing import Dict, Any, List

# 1. Import pandas first
import pandas as pd
import numpy as np

# 2. Mock pyarrow for sklearn compatibility with numpy 1.26
if 'pyarrow' not in sys.modules or not hasattr(sys.modules['pyarrow'], 'Table'):
    dummy_pa = types.ModuleType('pyarrow')
    dummy_pa.__path__ = []
    class DummyArrowType: pass
    dummy_pa.Table = DummyArrowType
    dummy_pa.RecordBatch = DummyArrowType
    dummy_pa.Array = DummyArrowType
    dummy_pa.ChunkedArray = DummyArrowType
    dummy_pa.__version__ = '15.0.0'
    sys.modules['pyarrow'] = dummy_pa

import sklearn
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.schemas import (
    SimulationInput, PredictionResponse, ModelPrediction, GateTelemetry,
    PresetScenario, HealthResponse
)


# Define NumpyLSTMModel for deserialization compatibility
class NumpyLSTMModel:
    def __init__(self, kernel, rec_kernel, bias, W_clf, b_clf, W_reg, b_reg, feature_names=None):
        self.kernel = np.array(kernel, dtype=np.float32)
        self.rec_kernel = np.array(rec_kernel, dtype=np.float32)
        self.bias = np.array(bias, dtype=np.float32)
        self.W_clf = np.array(W_clf, dtype=np.float32)
        self.b_clf = np.array(b_clf, dtype=np.float32)
        self.W_reg = np.array(W_reg, dtype=np.float32)
        self.b_reg = np.array(b_reg, dtype=np.float32)
        self.H = self.rec_kernel.shape[0]
        self.feature_names = feature_names or []

    @staticmethod
    def _sigmoid(z):
        return 1.0 / (1.0 + np.exp(-np.clip(z, -35.0, 35.0)))

    def forward(self, X):
        was_2d = False
        if X.ndim == 2:
            was_2d = True
            X = X[:, np.newaxis, :]

        N, T, D = X.shape
        H = self.H

        h = np.zeros((N, H), dtype=np.float32)
        c = np.zeros((N, H), dtype=np.float32)

        h_seq = []
        gates_seq = []

        for t in range(T):
            xt = X[:, t, :].astype(np.float32)
            gates = xt @ self.kernel + h @ self.rec_kernel + self.bias
            i = self._sigmoid(gates[:, 0:H])
            f = self._sigmoid(gates[:, H:2*H])
            c_cand = np.tanh(gates[:, 2*H:3*H])
            o = self._sigmoid(gates[:, 3*H:4*H])
            c = f * c + i * c_cand
            h = o * np.tanh(c)

            h_seq.append(h.copy())
            gates_seq.append({
                'input_gate': float(np.mean(i)),
                'forget_gate': float(np.mean(f)),
                'output_gate': float(np.mean(o)),
                'candidate_cell': float(np.mean(np.abs(c_cand))),
                'cell_state_norm': float(np.mean(np.abs(c))),
                'hidden_state_norm': float(np.mean(np.abs(h)))
            })

        h_all = np.stack(h_seq, axis=1)

        logits_clf = h_all @ self.W_clf + self.b_clf
        prob_all = self._sigmoid(logits_clf).squeeze(-1)
        pred_reg_all = (h_all @ self.W_reg + self.b_reg).squeeze(-1)

        if was_2d:
            return prob_all[:, 0], pred_reg_all[:, 0], gates_seq[0]
        return prob_all, pred_reg_all, gates_seq

    def predict_proba(self, X):
        prob, _, _ = self.forward(X)
        return prob

    def predict(self, X):
        _, pred_reg, _ = self.forward(X)
        return pred_reg


# Register for joblib pickler namespace resolution
sys.modules['__main__'].NumpyLSTMModel = NumpyLSTMModel
if 'ml.train_pipeline' not in sys.modules:
    dummy_train_mod = types.ModuleType('ml.train_pipeline')
    dummy_train_mod.NumpyLSTMModel = NumpyLSTMModel
    sys.modules['ml.train_pipeline'] = dummy_train_mod
else:
    sys.modules['ml.train_pipeline'].NumpyLSTMModel = NumpyLSTMModel


# Initialize FastAPI
app = FastAPI(
    title="QueueSense OPD Telemetry API",
    description="PS 1: Predicting Hospital OPD Overload using Preprocessing, MLP, and LSTM",
    version="1.0.0"
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Artifact storage paths
ARTIFACT_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
SCALER_PATH = os.path.join(ARTIFACT_DIR, "scaler.pkl")
MLP_PATH = os.path.join(ARTIFACT_DIR, "mlp_model.pkl")
LSTM_PATH = os.path.join(ARTIFACT_DIR, "lstm_model.pkl")
TELEMETRY_PATH = os.path.join(ARTIFACT_DIR, "telemetry_summary.json")

# In-memory model cache
MODELS: Dict[str, Any] = {}
TELEMETRY_DATA: Dict[str, Any] = {}


@app.on_event("startup")
def startup_event():
    load_artifacts()


def load_artifacts():
    if MODELS:
        return
    print(f"[QueueSense Backend] Loading artifacts from {ARTIFACT_DIR}...")
    if not all(os.path.exists(p) for p in [SCALER_PATH, MLP_PATH, LSTM_PATH, TELEMETRY_PATH]):
        raise RuntimeError(f"Model artifacts missing in {ARTIFACT_DIR}. Please run ml/train_pipeline.py first.")

    MODELS['scaler'] = joblib.load(SCALER_PATH)
    MODELS['mlp'] = joblib.load(MLP_PATH)
    MODELS['lstm'] = joblib.load(LSTM_PATH)

    with open(TELEMETRY_PATH, "r") as f:
        TELEMETRY_DATA.update(json.load(f))

    print("[QueueSense Backend] Scaler, MLP, LSTM, and Telemetry loaded successfully into memory.")

# Immediately load on startup/import
try:
    load_artifacts()
except Exception as e:
    print(f"[QueueSense Backend] Initial load deferred or failed: {e}")


# Pre-defined clinical scenario presets
CLINICAL_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "post-holiday-monday",
        "title": "Post-Holiday Monday Surge",
        "category": "Critical Surge",
        "description": "High backlog accumulation following clinic closure weekend. Patients arriving early with compressed scheduling intervals.",
        "clinical_rationale": "High booking density (16 slots), elevated previous-hour workload (78 mins), compounding wait times (52 mins).",
        "recommended_action": "Open Overflow Consultation Room 2 immediately; deploy rapid triage nurse to process nominal follow-ups.",
        "params": {
            "booked_slots": 16,
            "total_scheduled": 18,
            "avg_lead_days": 18.5,
            "avg_age": 54.0,
            "senior_ratio": 0.38,
            "sched_hour": 10,
            "cum_attended_today": 14,
            "cum_workload_today": 165.0,
            "prev_hour_wait": 52.0,
            "prev_2h_wait": 44.0,
            "prev_hour_workload": 78.0,
            "rolling_3h_wait": 48.0,
            "prev_day_avg_wait": 55.0,
            "day_of_week": 0,
            "month": 1
        }
    },
    {
        "id": "senior-heavy-morning",
        "title": "Senior-Heavy Morning Clinic",
        "category": "Geriatric Workflow",
        "description": "Morning clinic session with 85% geriatric patients requiring physical mobility assistance and extended clinical consultations.",
        "clinical_rationale": "Elderly demographic skew (mean age 74, 85% senior ratio) elevates average consultation duration to ~24 mins.",
        "recommended_action": "Extend nominal slot duration to 20 mins; assign healthcare assistants to bay escort duties.",
        "params": {
            "booked_slots": 12,
            "total_scheduled": 13,
            "avg_lead_days": 24.0,
            "avg_age": 74.0,
            "senior_ratio": 0.85,
            "sched_hour": 9,
            "cum_attended_today": 8,
            "cum_workload_today": 95.0,
            "prev_hour_wait": 38.0,
            "prev_2h_wait": 15.0,
            "prev_hour_workload": 62.0,
            "rolling_3h_wait": 26.5,
            "prev_day_avg_wait": 36.0,
            "day_of_week": 2,
            "month": 5
        }
    },
    {
        "id": "high-noshow-rainy",
        "title": "High No-Show Rainy Day",
        "category": "Capacity Surplus",
        "description": "Adverse weather leading to ~35% patient absenteeism and rapid appointment clearing, leaving excess physician capacity.",
        "clinical_rationale": "Low check-ins generate zero queue backlog; previous-hour wait was only 14 mins with 28 min total workload.",
        "recommended_action": "Nominal flow. Opportunity to accept emergency walk-in transfers or conduct elective chart reviews.",
        "params": {
            "booked_slots": 14,
            "total_scheduled": 15,
            "avg_lead_days": 32.0,
            "avg_age": 38.0,
            "senior_ratio": 0.12,
            "sched_hour": 14,
            "cum_attended_today": 12,
            "cum_workload_today": 85.0,
            "prev_hour_wait": 14.0,
            "prev_2h_wait": 18.0,
            "prev_hour_workload": 28.0,
            "rolling_3h_wait": 16.0,
            "prev_day_avg_wait": 24.0,
            "day_of_week": 3,
            "month": 7
        }
    },
    {
        "id": "afternoon-cascade",
        "title": "Afternoon Backlog Cascade",
        "category": "Cumulative Overload",
        "description": "Severe cascading delays where morning delays spill across the lunch shift, leaving 36 attended patients and 420 consultation minutes queued.",
        "clinical_rationale": "Intra-day queue compounding: prev_hour_wait = 68 mins, rolling_3h_wait = 63.5 mins. Feedforward MLP underpredicts vs LSTM recurrent state.",
        "recommended_action": "Trigger Level-3 Escalation: divert scheduled follow-ups to telemedicine or reschedule elective consults.",
        "params": {
            "booked_slots": 15,
            "total_scheduled": 16,
            "avg_lead_days": 15.0,
            "avg_age": 58.0,
            "senior_ratio": 0.45,
            "sched_hour": 15,
            "cum_attended_today": 36,
            "cum_workload_today": 420.0,
            "prev_hour_wait": 68.0,
            "prev_2h_wait": 59.0,
            "prev_hour_workload": 82.0,
            "rolling_3h_wait": 63.5,
            "prev_day_avg_wait": 49.0,
            "day_of_week": 1,
            "month": 10
        }
    },
    {
        "id": "nominal-midday-flow",
        "title": "Nominal Midday Flow",
        "category": "Optimal Operations",
        "description": "Smooth, well-balanced clinical operation with queue arrival rate strictly matching physician consultation throughput.",
        "clinical_rationale": "Moderate booking (8 slots), low wait time (22 mins), queue utilization rho ~ 0.76.",
        "recommended_action": "Standard operating protocol. Routine clinical staffing adequate.",
        "params": {
            "booked_slots": 8,
            "total_scheduled": 9,
            "avg_lead_days": 12.0,
            "avg_age": 44.0,
            "senior_ratio": 0.22,
            "sched_hour": 12,
            "cum_attended_today": 18,
            "cum_workload_today": 190.0,
            "prev_hour_wait": 22.0,
            "prev_2h_wait": 24.0,
            "prev_hour_workload": 46.0,
            "rolling_3h_wait": 23.0,
            "prev_day_avg_wait": 28.0,
            "day_of_week": 4,
            "month": 3
        }
    }
]


# =====================================================================
# API ENDPOINTS
# =====================================================================

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "operational",
        "version": "1.0.0",
        "models_loaded": "mlp" in MODELS and "lstm" in MODELS and "scaler" in MODELS,
        "architecture": "MLP (128-64-32) + Pure NumPy Recurrent LSTM (32-unit)",
        "memory_efficient": True
    }


@app.get("/api/telemetry")
def get_telemetry():
    """Returns complete evaluation metrics, ROC curves, confusion matrices, and dataset statistics."""
    if not TELEMETRY_DATA:
        raise HTTPException(status_code=500, detail="Telemetry data not initialized.")
    return TELEMETRY_DATA


@app.get("/api/presets")
def get_presets():
    """Returns realistic clinical triage simulator presets."""
    return CLINICAL_PRESETS


@app.get("/api/historical-days")
def get_historical_days():
    """Returns summary metadata of the 14 real historical 2024 test days."""
    if not TELEMETRY_DATA or 'historical_replay_days' not in TELEMETRY_DATA:
        raise HTTPException(status_code=500, detail="Historical replay days not available.")
    
    summary = []
    for day in TELEMETRY_DATA['historical_replay_days']:
        summary.append({
            "date": day['date'],
            "day_of_week": day['day_of_week'],
            "total_day_attended": day['total_day_attended'],
            "avg_day_wait": day['avg_day_wait'],
            "peak_overload_hours": day['peak_overload_hours']
        })
    return summary


@app.get("/api/historical-day/{date}")
def get_historical_day_detail(date: str):
    """Returns hour-by-hour telemetry and model predictions for a specific historical date."""
    if not TELEMETRY_DATA or 'historical_replay_days' not in TELEMETRY_DATA:
        raise HTTPException(status_code=500, detail="Historical replay data not loaded.")

    for day in TELEMETRY_DATA['historical_replay_days']:
        if day['date'] == date:
            return day

    raise HTTPException(status_code=404, detail=f"Date {date} not found in historical replay collection.")


@app.post("/api/predict", response_model=PredictionResponse)
def predict_overload(payload: SimulationInput):
    """
    Executes real-time inference using both MLP and recurrent NumPy LSTM models.
    Returns side-by-side predictions, queue utilization, staffing recommendations, and LSTM gate telemetry.
    """
    if "scaler" not in MODELS or "mlp" not in MODELS or "lstm" not in MODELS:
        raise HTTPException(status_code=500, detail="Models not loaded.")

    scaler = MODELS['scaler']
    mlp = MODELS['mlp']
    lstm: NumpyLSTMModel = MODELS['lstm']

    # Compute cyclical encodings
    hour = payload.sched_hour
    dow = payload.day_of_week
    month = payload.month

    hour_sin = np.sin(2 * np.pi * hour / 24.0)
    hour_cos = np.cos(2 * np.pi * hour / 24.0)
    dow_sin = np.sin(2 * np.pi * dow / 7.0)
    dow_cos = np.cos(2 * np.pi * dow / 7.0)
    month_sin = np.sin(2 * np.pi * month / 12.0)
    month_cos = np.cos(2 * np.pi * month / 12.0)

    # Feature vector matching exact trained feature order
    feature_vector = np.array([[
        payload.booked_slots,
        payload.total_scheduled,
        payload.avg_lead_days,
        payload.avg_age,
        payload.senior_ratio,
        payload.sched_hour,
        hour_sin,
        hour_cos,
        dow_sin,
        dow_cos,
        month_sin,
        month_cos,
        payload.cum_attended_today,
        payload.cum_workload_today,
        payload.prev_hour_wait,
        payload.prev_2h_wait,
        payload.prev_hour_workload,
        payload.rolling_3h_wait,
        payload.prev_day_avg_wait
    ]], dtype=np.float32)

    # Scale feature vector
    X_scaled = scaler.transform(feature_vector)

    # 1. MLP Prediction
    mlp_prob = float(mlp['classifier'].predict_proba(X_scaled)[0, 1])
    mlp_wait = float(np.clip(mlp['regressor'].predict(X_scaled)[0], 0.0, None))
    mlp_is_overloaded = bool(mlp_prob >= 0.5 or mlp_wait > 45.0)
    mlp_rho = round(mlp_wait / 45.0, 2)

    # 2. LSTM Prediction
    lstm_prob_arr, lstm_wait_arr, lstm_gates = lstm.forward(X_scaled)
    lstm_prob = float(lstm_prob_arr[0])
    lstm_wait = float(np.clip(lstm_wait_arr[0], 0.0, None))
    lstm_is_overloaded = bool(lstm_prob >= 0.5 or lstm_wait > 45.0)
    lstm_rho = round(lstm_wait / 45.0, 2)

    # Risk level categorization
    max_prob = max(mlp_prob, lstm_prob)
    max_wait = max(mlp_wait, lstm_wait)

    if max_prob >= 0.70 or max_wait > 55.0:
        risk_category = "Critical Overload"
        buffer_slots = 0
        action = f"[CRITICAL OVERLOAD] Open Overflow Room at {hour:02d}:00 (Projected wait: {max_wait:.0f} mins, Utilization rho={max(mlp_rho, lstm_rho):.2f}). Deploy second physician and expedite triage."
    elif max_prob >= 0.40 or max_wait > 35.0:
        risk_category = "Approaching Capacity"
        buffer_slots = 2
        action = f"[CAPACITY WARNING] Place On-Call Physician on standby for {hour:02d}:00. Pause elective add-on bookings and monitor waiting bay density."
    else:
        risk_category = "Nominal Flow"
        buffer_slots = 4
        action = f"[NOMINAL FLOW] Operations nominal at {hour:02d}:00. Standard consultation pacing maintained; projected wait {max_wait:.0f} mins."

    def get_status_str(prob, wait):
        if prob >= 0.7 or wait > 55: return "Critical"
        if prob >= 0.4 or wait > 35: return "Elevated"
        return "Nominal"

    return {
        "mlp": {
            "model_name": "Multi-Layer Perceptron",
            "architecture": "MLP (128 -> 64 -> 32)",
            "overload_probability": round(mlp_prob, 4),
            "is_overloaded": mlp_is_overloaded,
            "predicted_wait_mins": round(mlp_wait, 1),
            "queue_utilization_rho": mlp_rho,
            "status": get_status_str(mlp_prob, mlp_wait),
            "risk_level": "High" if mlp_prob >= 0.6 else "Moderate" if mlp_prob >= 0.35 else "Low"
        },
        "lstm": {
            "model_name": "LSTM Recurrent Network",
            "architecture": "Recurrent LSTM (32-unit sliding cell)",
            "overload_probability": round(lstm_prob, 4),
            "is_overloaded": lstm_is_overloaded,
            "predicted_wait_mins": round(lstm_wait, 1),
            "queue_utilization_rho": lstm_rho,
            "status": get_status_str(lstm_prob, lstm_wait),
            "risk_level": "High" if lstm_prob >= 0.6 else "Moderate" if lstm_prob >= 0.35 else "Low"
        },
        "lstm_gates": {
            "input_gate": round(lstm_gates['input_gate'], 4),
            "forget_gate": round(lstm_gates['forget_gate'], 4),
            "output_gate": round(lstm_gates['output_gate'], 4),
            "candidate_cell": round(lstm_gates['candidate_cell'], 4),
            "cell_state_norm": round(lstm_gates['cell_state_norm'], 4),
            "hidden_state_norm": round(lstm_gates['hidden_state_norm'], 4)
        },
        "queue_backlog_delta_mins": round(lstm_wait - mlp_wait, 1),
        "staffing_recommendation": action,
        "suggested_buffer_slots": buffer_slots,
        "overload_risk_category": risk_category,
        "timestamp": datetime.now().isoformat()
    }


# =====================================================================
# STATIC ASSET SERVING FOR COMPILED FRONTEND (SINGLE-CONTAINER DEPLOY)
# =====================================================================

FRONTEND_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(FRONTEND_DIST_DIR):
    # Mount assets subfolder
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # Serve index.html fallback for client-side routing
    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        target = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
        index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Frontend dist not built. Run npm run build inside frontend/."}
