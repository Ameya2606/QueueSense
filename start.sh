#!/usr/bin/env bash
# QueueSense - One-Command Local Launcher
set -e

echo "=========================================================="
echo "  QueueSense // Hospital OPD Overload Prediction System"
echo "=========================================================="

# 1. Check Python
echo "[1/4] Checking Python environment..."
python --version

# 2. Check ML Artifacts
if [ ! -f "backend/artifacts/mlp_model.pkl" ] || [ ! -f "backend/artifacts/lstm_model.pkl" ]; then
    echo "[!] Artifacts missing. Running ML training pipeline..."
    python ml/train_pipeline.py
else
    echo "[OK] Model artifacts verified on disk."
fi

# 3. Build Frontend if needed
if [ ! -d "frontend/dist" ]; then
    echo "[2/4] Building production React frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
else
    echo "[OK] Frontend production build verified."
fi

# 4. Start Unified Server
echo "[3/4] Launching FastAPI Unified Service on http://127.0.0.1:8000..."
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
