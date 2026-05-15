# CoreInsight - Smart AI Assistant for Technical Decision-Making

CoreInsight is a production-style AI engineering copilot for rotating machines (motors, pumps, industrial drives).  
It combines machine learning, rule-based diagnostics, trend intelligence, and deterministic explainability to provide technical recommendations.

## 1) Project Overview

CoreInsight monitors multi-parameter machine telemetry and assists engineers in:
- anomaly detection
- failure risk prediction
- root-cause reasoning
- what-if simulation
- actionable maintenance decisions

## 2) Problem Statement

Industrial systems produce high-volume telemetry, but teams often lack a unified decision-support layer that can:
- detect early warning signs,
- explain why risk is increasing,
- prioritize intervention urgency,
- and communicate recommendations clearly.

## 3) Solution

CoreInsight delivers an end-to-end decision support stack:
- FastAPI backend for analytics APIs
- ML pipeline (Isolation Forest + RandomForestClassifier)
- local explainability engine with ranked contributors + root-cause synthesis
- command-driven local conversational assistant for analysis navigation
- Streamlit dashboard with trend visuals, gauges, diagnostics, and history
- SQLite persistence for analysis memory

## 4) Features

- Multi-parameter input with validation ranges and grouped UX.
- Anomaly detection with score, label, and severity.
- Failure probability prediction with risk category.
- Parameter intelligence (safe range, deviation, status, explanation).
- Decision engine (`SAFE`, `MONITOR`, `ATTENTION REQUIRED`, `CRITICAL ACTION`).
- Trend analysis and previous-reading comparison.
- Structured engineering report generation via deterministic local logic.
- Explainability summary (feature impact ranking).
- What-if simulation endpoint and UI controls.
- Conversational assistant with context from latest analysis + chat history.
- Historical analysis retrieval from SQLite.

## 5) Tech Stack

- Backend: Python 3.11+, FastAPI
- ML: scikit-learn, pandas, numpy
- AI: Local deterministic reasoning engine (no external LLM dependency)
- Frontend: Streamlit
- Visualization: Plotly, matplotlib-ready utilities
- Storage: SQLite

## 6) Architecture Diagram

```text
┌────────────────────────────┐
│       Streamlit UI         │
│ Inputs / Charts / Chat     │
└─────────────┬──────────────┘
              │ HTTP
┌─────────────▼──────────────┐
│        FastAPI API         │
│ /analyze /predict /simulate│
│ /history /chat             │
└──────┬─────────┬───────────┘
       │
       ├──────────────► ML Pipeline
       │               (IsolationForest + RandomForest)
       │
       ├──────────────► Local Intelligence Layer
       │               (diagnostics, trends, decisioning, explainability)
       │
       └──────────────► SQLite History Store
                       (analysis + chat memory)
```

## 7) ML Models Used

- **Isolation Forest**: unsupervised anomaly detection over 10 machine features.
- **RandomForestClassifier**: supervised failure prediction probability.
- **Synthetic bootstrapped training data**: generated at startup to keep the demo self-contained and reproducible.

## 8) Local Explainability and Reasoning

Innovexa now runs fully local deterministic intelligence:
- feature-importance-driven contributor ranking
- threshold/deviation reasoning per parameter
- trend-aware diagnostics using rolling average + slope behavior
- historical comparison against previous readings
- context-aware recommendation synthesis

## Explainability Architecture

`/analyze` uses a local explainability engine that combines:
- safe-range deviation ranking
- RandomForest feature importance
- trend classification (`Rising`, `Stable`, `Falling`, `Volatile`)
- historical comparison deltas and rolling-average deltas
- deterministic language generation for root-cause and actions

This guarantees explainability without cloud AI dependencies.

## Resilience and Reliability Features

- Modular stage-based analysis pipeline:
  - `validate_input`
  - `preprocess_input`
  - `run_anomaly_detection`
  - `run_failure_prediction`
  - `compute_parameter_diagnostics`
  - `generate_explainability`
  - `generate_decision_report`
  - `generate_visualizations`
  - `build_final_response`
- Graceful stage-level fallback on non-critical failures.
- Centralized FastAPI exception handlers.
- Structured logging with rotating file output at `logs/system.log`.
- Visualization generation isolated from core analysis path (non-fatal on failure).

## 9) Screenshots

<img width="1919" height="953" alt="Screenshot 2026-05-07 155804" src="https://github.com/user-attachments/assets/7f4bf7b9-71f1-44f1-a6fd-a4a3dd175cc9" />

- main dashboard (cards + gauges)
- trend charts with threshold bands
- diagnostics table
- simulation panel
- chat assistant output

## 10) API Documentation

Base URL: `http://127.0.0.1:8000`

- `POST /analyze`  
  Input: machine ID + full parameter set  
  Output: anomaly, failure risk, diagnostics, trends, decision priority, report, and structured analysis envelope

- `POST /predict`  
  Input: machine ID + parameters  
  Output: failure probability + risk + feature importance

- `POST /simulate`  
  Input: base parameters + overridden parameters  
  Output: risk impact comparison

- `GET /history?machine_id=...&limit=...`  
  Output: recent persisted analyses

- `POST /chat`  
  Input: machine ID + user question  
  Output: contextual engineering response

Health check:
- `GET /health`

### `/analyze` response envelope

`structured_analysis` always contains:

```json
{
  "system_summary": {},
  "key_observations": [],
  "root_cause_analysis": [],
  "recommended_actions": [],
  "risk_assessment": {},
  "parameter_diagnostics": [],
  "trend_analysis": [],
  "historical_comparison": [],
  "root_cause_analysis": [],
  "visualizations": [],
  "ml_outputs": {},
  "explainability": {},
  "recommended_actions": [],
  "risk_assessment": {}
}
```

## 11) Setup Instructions

1. **Clone and enter project**
   ```bash
   cd innovexa
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   - Edit `.env` if needed for local runtime settings

5. **Run backend**
   ```bash
   uvicorn backend.main:app --reload
   ```

6. **Run frontend (new terminal)**
   ```bash
   streamlit run frontend/app.py
   ```

## 12) Future Scope

- Live IoT ingestion (MQTT/Kafka/OPC-UA connectors)
- Model retraining pipeline with real labeled events
- true SHAP integration for local/global explanations
- alerting integrations (email, Slack, CMMS)
- role-based access, auth, and audit logs
- multi-machine fleet dashboard + reliability KPIs
