# 🏥 QueueSense: Hospital OPD Overload Prediction System

> **PS 1: Predicting Hospital OPD Overload using Preprocessing, MLP, and Recurrent LSTM Networks**  
> An end-to-end, production-grade clinical telemetry platform and machine learning system for real-time patient queue forecasting, queue utilization modeling ($\rho$), and proactive hospital staffing orchestration.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3+-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4+-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4+-F7931E.svg?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 1. System Architecture

QueueSense operates as a **single unified full-stack service**. The FastAPI application serves high-speed ML inference endpoints at `/api/*` and directly mounts the compiled React 18 production bundle at `/`, eliminating CORS issues and allowing single-container deployment on free cloud tiers (Render, Railway, Docker) with `< 40MB` RAM consumption.

```
                              QUEUESENSE ARCHITECTURE
┌───────────────────────────────────────────────────────────────────────────────┐
│ RAW CLINICAL DATASETS                                                         │
│ appointments.csv (111,488) + slots.csv (104,360) + patients.csv (36,697)      │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ ML PREPROCESSING & TEMPORAL FEATURE PIPELINE (ml/train_pipeline.py)           │
│ • Deterministic join & resample into 26,090 hourly OPD buckets (08:00..17:00) │
│ • Cyclical 24h clock encodings: sin/cos(hour), sin/cos(dow), sin/cos(month)   │
│ • Intraday queue backlog lags: cum_attended, cum_workload, rolling_3h_wait    │
│ • Strict 80/20 non-shuffled chronological split: 2015-2022 Train / 2023-2024 │
└───────────────────────┬───────────────────────────────┬───────────────────────┘
                        │                               │
                        ▼                               ▼
     ┌──────────────────────────────────┐ ┌──────────────────────────────────┐
     │ MODEL 1: MULTI-LAYER PERCEPTRON  │ │ MODEL 2: RECURRENT LSTM NETWORK  │
     │ Dual MLPClassifier & Regressor   │ │ 32-Unit Sequential Memory Cell   │
     │ Architecture: 128 -> 64 -> 32    │ │ Exported to Pure NumPy Class     │
     │ (backend/artifacts/mlp_model.pkl)│ │ (backend/artifacts/lstm_model)   │
     └──────────────────┬───────────────┘ └──────────────────┬───────────────┘
                        │                                    │
                        └─────────────────┬──────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ FASTAPI UNIFIED BACKEND SERVICE (backend/main.py)                             │
│ • Zero CUDA/heavy Torch runtime dependencies (pure NumPy inference <1ms)     │
│ • Serves /api/predict, /api/telemetry, /api/presets, /api/historical-days     │
│ • Mounts compiled frontend/dist at / (Single-port unified deployment)         │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│ BESPOKE SWISS CLINICAL COMMAND TERMINAL (React 18 + Vite + Tailwind CSS)     │
│ 1. Live Triage Simulator & Staffing Orchestrator (Interactive Floorplan)      │
│ 2. 2024 Historical Clinic Day Replay Engine (Timeline Scrubbing)              │
│ 3. MLP vs. LSTM Architecture & Benchmark Lab (ROC Curves & Confusion Matrix)  │
│ 4. Preprocessing & Dataset Telemetry Inspector (Pipeline Transformation)      │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Dataset Schema & Pipeline Transformation

The system ingests the three ground-truth root CSV files without synthetic hallucination:
- `appointments.csv` (111,488 rows, 16 columns)
- `slots.csv` (104,360 rows, 4 columns)
- `patients.csv` (36,697 rows, 5 columns)

### Hourly OPD Aggregation Methodology:
1. `appointments.csv` and `slots.csv` are filtered for operating hours `08:00` to `17:00` (10 operating hours/day).
2. For attended appointments, check-in arrival offset is computed:
   $$\text{offset}_{\text{mins}} = \frac{t_{\text{check\_in}} - t_{\text{appointment}}}{60}$$
3. The Cartesian product of all 2,609 unique operational dates $\times$ 10 hours yields exactly **26,090 hourly OPD buckets**.
4. Feature aggregation per `(appointment_date, sched_hour)`:
   - `booked_slots`: Count of `is_available == False` in `slots.csv`
   - `total_scheduled`: Count of appointments booked for this hour
   - `attended_count`, `cancelled_count`, `no_show_count`
   - `avg_lead_days`, `avg_age`, `senior_ratio` ($\text{age} \ge 60$)
   - `avg_wait_time`, `max_wait_time`, `avg_duration`, `total_workload_mins`
5. **Intraday Backlog Isolation:** Grouped strictly by `appointment_date` so lag features never bleed across midnight into the following morning's 08:00 slot:
   - `prev_hour_wait`, `prev_2h_wait`, `prev_hour_workload`
   - `cum_attended_today`, `cum_workload_today`
   - `rolling_3h_wait`
   - `prev_day_avg_wait`: Macro previous clinic day's overall average wait time.

### Dual-Task Target Definition:
- **Regression Target:** Exact patient wait time in minutes ($avg\_wait\_time$).
- **Classification Target:** Binary overload state ($is\_overloaded \in \{0, 1\}$):
  $$is\_overloaded = \begin{cases} 1 & \text{if } avg\_wait\_time > 45.0 \text{ min} \lor total\_workload\_mins > 65.0 \text{ min} \\ 0 & \text{otherwise} \end{cases}$$
  *(Queue utilization threshold $\rho = 65.0 / 60.0 = 1.083$)*

---

## 3. Machine Learning Models & Real Test Evaluation

Training strictly respects time:
- **Training Set (80%):** 2015-01-01 to 2022-12-31 (2,087 clinic days = **20,870 hourly buckets**)
- **Test Set (20%):** 2023-01-01 to 2024-12-24 (522 clinic days = **5,220 hourly buckets**)
- `StandardScaler` is fitted strictly on `X_train` and saved to `backend/artifacts/scaler.pkl`.

### Model 1: Multi-Layer Perceptron (MLP)
- `MLPClassifier(hidden_layer_sizes=(128, 64, 32), activation='relu', early_stopping=True)` for overload probability.
- `MLPRegressor(hidden_layer_sizes=(128, 64, 32), activation='relu', early_stopping=True)` for wait-time regression.
- Bundled into `backend/artifacts/mlp_model.pkl`.

### Model 2: Pure NumPy Recurrent LSTM Network
- Trained as a dual-head sequential network over sliding 10-hour clinic day sequences.
- **Portability Innovation:** Trained weights are exported into a lightweight `NumpyLSTMModel` class (`backend/artifacts/lstm_model.pkl`) that executes the exact recurrent gating equations in pure NumPy:
  $$i_t = \sigma(W_i x_t + R_i h_{t-1} + b_i)$$
  $$f_t = \sigma(W_f x_t + R_f h_{t-1} + b_f)$$
  $$\tilde{c}_t = \tanh(W_c x_t + R_c h_{t-1} + b_c)$$
  $$o_t = \sigma(W_o x_t + R_o h_{t-1} + b_o)$$
  $$c_t = f_t \odot c_{t-1} + i_t \odot \tilde{c}_t$$
  $$h_t = o_t \odot \tanh(c_t)$$
- Guarantees `< 1ms` inference with zero PyTorch/CUDA DLL installation issues on any hosting platform.

### Empirical Test Set Results (5,220 Holdout Instances):

| Metric | MLP Perceptron | LSTM Recurrent | Delta ($\Delta$ LSTM vs MLP) | Significance |
| :--- | :--- | :--- | :--- | :--- |
| **Classification Accuracy** | **72.72%** | **72.80%** | `+0.08%` | Balanced holdout accuracy |
| **Precision** | **77.53%** | **81.59%** | `+4.06%` | **Higher purity in crisis detection** |
| **Recall / Sensitivity** | **70.82%** | **65.13%** | `-5.69%` | Conservative alert rate |
| **F1 Score** | **0.7402** | **0.7244** | `-0.0158` | Strong harmonic mean |
| **ROC-AUC** | **0.8327** | **0.8277** | `-0.0050` | High discriminative power |
| **Regression MAE** | **9.70 mins** | **15.16 mins** | `+5.46m` | Exact minute tracking |
| **Regression RMSE** | **12.41 mins** | **25.58 mins** | `+13.17m` | Outlier penalty |
| **Regression $R^2$ Score** | **0.9016** | **0.5818** | `-0.3198` | Strong variance explained |

### Why LSTM Captures Cascading Queue Delays Differently:
Stateless feedforward MLPs treat each hour as an isolated snapshot. When late afternoon surges occur (e.g. 15:00), the MLP only sees static lag numbers. In contrast, the LSTM's forget gate $f_t$ modulates cumulative cell memory $c_t$ across the entire day, capturing whether morning delays have truly dissipated or are compounding into the evening shift.

---

## 4. Bespoke Swiss Design System

Inspired by **Palantir Foundry, Linear, Teenage Engineering, and Braun Medical Instruments**:
- **Palette:** Warm Surgical Paper (`#F4F3EF`), Deep Obsidian Slate (`#0B0D10`, `#12151B`), Exposed Swiss Hairlines (`#282D37`), International Signal Orange (`#FF4F00`) for overload alerts, Medical Emerald (`#00875A`) for nominal flow, Amber (`#D97706`) for capacity caution.
- **Typography:** `'Space Grotesk'` (headers), `'Inter'` (labels), `'JetBrains Mono'` (telemetry & matrices).
- **Interactive Workspaces:**
  1. **Live Triage Simulator:** 5 realistic clinical scenario presets, interactive parameter sliders, side-by-side MLP vs. LSTM cards, live LSTM gate activation bars ($i_t, f_t, o_t, \tilde{c}_t, |c_t|, |h_t|$), and animated SVG Live OPD Floorplan.
  2. **2024 Historical Replay Engine:** Scrub hour-by-hour across 14 ground-truth dates from the 2024 test set with play/pause timeline controls and actual vs. predicted comparative curves.
  3. **MLP vs. LSTM Architecture & Benchmark Lab:** Side-by-side ROC curves (Recharts), complete metrics table, dual interactive confusion matrices, and queue theory breakdown.
  4. **Preprocessing & Dataset Inspector:** 3-to-1 dataset pipeline cards, radial 24-hour clock cyclical $\sin/\cos$ visualizer, hourly bottleneck distributions, and insurance provider breakdown (11 providers).

---

## 5. Local Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ (for frontend development / compilation)

### One-Command Setup & Run
```bash
# Clone the repository
git clone https://github.com/your-username/QueueSense.git
cd QueueSense

# Run local launcher (or run steps manually below)
chmod +x start.sh
./start.sh
```

### Manual Step-by-Step Launch:
```bash
# 1. Install backend dependencies
pip install -r requirements.txt

# 2. Run ML Training Pipeline (generates .pkl & .json artifacts in backend/artifacts/)
python ml/train_pipeline.py

# 3. Build React/Vite Frontend
cd frontend
npm install
npm run build
cd ..

# 4. Start Unified FastAPI Service
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at **http://127.0.0.1:8000** to access the complete application.

---

## 6. Cloud Deployment

### Option A: Docker (Any Cloud / VPS)
```bash
docker build -t queuesense:latest .
docker run -p 8000:8000 queuesense:latest
```

### Option B: Render One-Click Deployment
1. Push this repository to GitHub.
2. In Render, select **New Blueprint** and link your repository.
3. Render reads `render.yaml` and deploys the unified Docker web service automatically.

---

## 7. Committing & Pushing to GitHub Desktop

The repository is pre-initialized and ready for immediate push to GitHub Desktop:

1. Open **GitHub Desktop**.
2. Click **File** $\rightarrow$ **Add Local Repository...** (or press `Ctrl+O`).
3. Select this folder: `D:\QueueSense`.
4. The initial commit is prepared with all source files, trained models in `backend/artifacts/`, and compiled frontend.
5. Click **Publish repository** to push it directly to your GitHub account under **"QueueSense"**!

---

## 8. Repository Structure

```text
QueueSense/
├── appointments.csv              # Ground-truth clinical appointments dataset (111,488 rows)
├── patients.csv                  # Registered patient demographics & insurance (36,697 rows)
├── slots.csv                     # 15-minute operational slots (104,360 rows)
├── ml/
│   └── train_pipeline.py         # End-to-end preprocessing, MLP + LSTM training, .pkl export
├── backend/
│   ├── main.py                   # FastAPI app serving /api/* + static frontend/dist
│   ├── schemas.py                # Pydantic request/response schemas
│   └── artifacts/                # Committed model artifacts (<1MB total)
│       ├── scaler.pkl            # Fitted StandardScaler
│       ├── mlp_model.pkl         # Trained MLPClassifier & MLPRegressor bundle
│       ├── lstm_model.pkl        # Pure NumPy LSTM recurrent inference engine
│       └── telemetry_summary.json# Ground-truth metrics, 14 replay days, ROC & confusion matrix
├── frontend/
│   ├── index.html                # Google Fonts & HTML5 entry point
│   ├── package.json              # React 18, Vite, Tailwind CSS, Framer Motion, Recharts
│   ├── vite.config.js            # Dev proxy to http://127.0.0.1:8000
│   ├── tailwind.config.js        # Swiss clinical design tokens & palette
│   ├── postcss.config.js
│   ├── dist/                     # Pre-compiled production bundle (committed for instant zero-npm deploy)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx               # Workspace navigation & layout
│       ├── index.css             # Swiss design system & custom scrollbars
│       └── components/
│           ├── Header.jsx                # Clinical terminal header & live telemetry
│           ├── FloorplanVisualizer.jsx   # Animated SVG Live OPD Floorplan & Queue Transit
│           ├── TriageSimulator.jsx       # Workspace 1: Interactive Triage & Staffing Orchestrator
│           ├── HistoricalReplay.jsx      # Workspace 2: 2024 Historical Clinic Day Replay Engine
│           ├── ModelBenchmarkLab.jsx     # Workspace 3: MLP vs. LSTM Architecture & Benchmark Lab
│           └── DatasetInspector.jsx      # Workspace 4: Preprocessing & Dataset Telemetry Inspector
├── requirements.txt              # Production Python dependencies (no bloated GPU packages)
├── Dockerfile                    # Multi-stage container build
├── render.yaml                   # One-click Render deployment blueprint
├── start.sh                      # Local one-command launcher
├── .gitignore                    # Ensures artifacts are tracked
└── README.md                     # Comprehensive documentation
```

---
*Developed with precision for PS 1: Predicting Hospital OPD Overload using Preprocessing, MLP, and LSTM.*
