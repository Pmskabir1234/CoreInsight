"""Streamlit frontend for CoreInsight engineering dashboard (button-driven API calls)."""

from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Any, Dict

import pandas as pd
import plotly.graph_objects as go
import requests
import streamlit as st

API_BASE = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PLOT_PATH = PROJECT_ROOT / "models" / "model_accuracy_comparison.png"


def default_params() -> Dict[str, float]:
    return {
        "vibration_rms": 4.8,
        "rpm": 2900.0,
        "torque_nm": 175.0,
        "bearing_temp_c": 78.0,
        "ambient_temp_c": 32.0,
        "motor_current_a": 58.0,
        "voltage_v": 415.0,
        "flow_rate_l_min": 470.0,
        "pressure_bar": 6.2,
        "humidity_percent": 54.0,
    }


def build_payload(machine_id: str, params: Dict[str, float]) -> Dict[str, Any]:
    return {"machine_id": machine_id, "parameters": params}


def api_post(path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    response = requests.post(f"{API_BASE}{path}", json=payload, timeout=45)
    response.raise_for_status()
    return response.json()


def api_get(path: str) -> Dict[str, Any]:
    response = requests.get(f"{API_BASE}{path}", timeout=45)
    response.raise_for_status()
    return response.json()


def risk_color(risk: str) -> str:
    return {"Low": "#16a34a", "Medium": "#ca8a04", "High": "#ea580c", "Critical": "#dc2626"}.get(
        risk, "#3b82f6"
    )


def gauge(value: float, title: str) -> go.Figure:
    fig = go.Figure(
        go.Indicator(
            mode="gauge+number",
            value=value,
            title={"text": title},
            gauge={
                "axis": {"range": [0, 100]},
                "bar": {"color": "#0ea5e9"},
                "steps": [
                    {"range": [0, 35], "color": "#7f1d1d"},
                    {"range": [35, 65], "color": "#854d0e"},
                    {"range": [65, 100], "color": "#14532d"},
                ],
            },
        )
    )
    fig.update_layout(height=260, margin=dict(l=20, r=20, t=40, b=10), template="plotly_dark")
    return fig


def init_session_state() -> None:
    defaults = {
        "latest_analysis": None,
        "latest_predict": None,
        "latest_simulation": None,
        "history_items": None,
        "health_info": None,
        "last_error": None,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def render_analysis(analysis: Dict[str, Any]) -> None:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Failure Probability", f"{analysis['failure_probability_percent']:.2f}%")
    c2.metric("Anomaly Score", f"{analysis['anomaly_score']:.3f}")
    c3.metric("Decision Priority", analysis["decision_priority"])
    c4.metric("Risk Category", analysis["risk_category"])

    banner = f"System Status: {analysis['decision_priority']} | Risk: {analysis['risk_category']}"
    st.markdown(
        f"<div style='display:block;padding:10px;border-radius:8px;background:{risk_color(analysis['risk_category'])};color:white;'>"
        f"<b>{banner}</b></div>",
        unsafe_allow_html=True,
    )

    gc1, gc2 = st.columns(2)
    gc1.plotly_chart(gauge(analysis["health_score"], "Health Meter"), use_container_width=True)
    gc2.plotly_chart(gauge(analysis["failure_probability_percent"], "Risk Gauge"), use_container_width=True)

    st.subheader("Parameter Diagnostics")
    diag_df = pd.DataFrame(analysis.get("parameter_diagnostics", []))
    if diag_df.empty:
        st.info("No diagnostics available.")
    else:
        st.dataframe(diag_df, use_container_width=True, hide_index=True)
        for _, row in diag_df.iterrows():
            sev_color = (
                "#16a34a"
                if row["status"] == "Normal"
                else "#f59e0b"
                if row["status"] == "Warning"
                else "#dc2626"
            )
            pct = min(100.0, float(row.get("deviation_percent", 0.0)))
            st.markdown(
                f"<div style='margin-bottom:6px;'>"
                f"<span style='display:inline-block;width:180px;color:{sev_color};'>{row['parameter']}</span>"
                f"<progress value='{pct}' max='100' style='width:55%;'></progress>"
                f"<span style='margin-left:8px;color:{sev_color};'>{row['status']}</span></div>",
                unsafe_allow_html=True,
            )

    st.subheader("Top Feature Importance")
    importance = analysis.get("feature_importance", [])
    if importance:
        st.dataframe(pd.DataFrame(importance[:6]), use_container_width=True, hide_index=True)
    else:
        st.info("Feature importance not available.")

    st.subheader("Trend Insights")
    trend_rows = analysis.get("trend_insights", [])
    if trend_rows:
        for row in trend_rows:
            st.write(f"- **{row['metric']}**: {row['trend']} - {row['detail']}")
    else:
        st.info("No trend insights available.")
    if analysis.get("comparison_note"):
        st.info(analysis["comparison_note"])

    structured = analysis.get("structured_analysis", {})
    visuals = structured.get("visualizations", [])
    if visuals:
        st.subheader("Generated Trend Visualizations")
        cols = st.columns(min(3, len(visuals)))
        for idx, item in enumerate(visuals[:3]):
            with cols[idx]:
                st.caption(item.get("title", item.get("metric", "Visualization")))
                try:
                    st.image(base64.b64decode(item["image_base64"]), use_container_width=True)
                except Exception:
                    st.warning("Unable to decode visualization image.")

    st.subheader("Engineering Decision Report")
    st.markdown(analysis.get("engineering_report", "No report available."))
    with st.expander("Detailed Explainability"):
        for line in structured.get("root_cause_analysis", []):
            st.write(f"- {line}")
    with st.expander("Historical Comparison"):
        for item in structured.get("historical_comparison", []):
            st.write(f"- {item.get('detail', '')}")


st.set_page_config(page_title="CoreInsight", layout="wide", page_icon="🤖")
st.markdown(
    """
    <style>
    .stApp {background-color: #0b1220; color: #e5e7eb;}
    .block-container {padding-top: 1rem;}
    </style>
    """,
    unsafe_allow_html=True,
)
st.title("CoreInsight - Stop Guessing. Start Predicting")
st.caption("Industrial Automation | Predictive Maintenance | Anomaly Detection")
init_session_state()

with st.sidebar:
    st.subheader("System Inputs")
    machine_id = st.text_input("Machine ID", value="MOTOR-LINE-07")
    defaults = default_params()

    st.markdown("### Mechanical")
    vibration_rms = st.number_input("Vibration RMS (mm/s)", 0.0, 50.0, defaults["vibration_rms"])
    rpm = st.number_input("RPM", 100.0, 10000.0, defaults["rpm"])
    torque_nm = st.number_input("Torque (Nm)", 0.0, 5000.0, defaults["torque_nm"])

    st.markdown("### Thermal")
    bearing_temp_c = st.number_input("Bearing Temperature (C)", -20.0, 220.0, defaults["bearing_temp_c"])
    ambient_temp_c = st.number_input("Ambient Temperature (C)", -30.0, 80.0, defaults["ambient_temp_c"])

    st.markdown("### Electrical")
    motor_current_a = st.number_input("Motor Current (A)", 0.0, 500.0, defaults["motor_current_a"])
    voltage_v = st.number_input("Voltage (V)", 100.0, 1000.0, defaults["voltage_v"])

    st.markdown("### Process")
    flow_rate_l_min = st.number_input("Flow Rate (L/min)", 0.0, 3000.0, defaults["flow_rate_l_min"])
    pressure_bar = st.number_input("Pressure (bar)", 0.0, 100.0, defaults["pressure_bar"])
    humidity_percent = st.number_input("Humidity (%)", 0.0, 100.0, defaults["humidity_percent"])

    params = {
        "vibration_rms": vibration_rms,
        "rpm": rpm,
        "torque_nm": torque_nm,
        "bearing_temp_c": bearing_temp_c,
        "ambient_temp_c": ambient_temp_c,
        "motor_current_a": motor_current_a,
        "voltage_v": voltage_v,
        "flow_rate_l_min": flow_rate_l_min,
        "pressure_bar": pressure_bar,
        "humidity_percent": humidity_percent,
    }

    st.divider()
    st.subheader("API Actions")
    btn_analyze = st.button("Run Analysis", type="primary", use_container_width=True)
    btn_predict = st.button("Predict Failure", use_container_width=True)
    btn_history = st.button("Load History", use_container_width=True)
    btn_health = st.button("Check Backend Health", use_container_width=True)

    if MODEL_PLOT_PATH.exists():
        with st.expander("Model Accuracy Comparison"):
            st.image(str(MODEL_PLOT_PATH), use_container_width=True)

st.subheader("What-if Simulation")
sc1, sc2, sc3, sc4 = st.columns([1, 1, 1, 1])
delta_temp = sc1.slider("Bearing Temp Delta (C)", -30, 30, 15)
delta_vib = sc2.slider("Vibration Delta (mm/s)", -8, 8, 2)
delta_current = sc3.slider("Current Delta (A)", -50, 50, 10)
btn_simulate = sc4.button("Run Simulation", use_container_width=True)

if btn_health:
    try:
        st.session_state.health_info = api_get("/health")
        st.session_state.last_error = None
    except Exception as exc:
        st.session_state.last_error = str(exc)

if btn_predict:
    try:
        st.session_state.latest_predict = api_post("/predict", build_payload(machine_id, params))
        st.session_state.last_error = None
    except Exception as exc:
        st.session_state.last_error = str(exc)

if btn_analyze:
    try:
        with st.spinner("Running full analysis pipeline..."):
            st.session_state.latest_analysis = api_post("/analyze", build_payload(machine_id, params))
        st.session_state.last_error = None
    except Exception as exc:
        st.session_state.last_error = str(exc)

if btn_history:
    try:
        st.session_state.history_items = api_get(f"/history?machine_id={machine_id}&limit=5")
        st.session_state.last_error = None
    except Exception as exc:
        st.session_state.last_error = str(exc)

if btn_simulate:
    override = dict(params)
    override["bearing_temp_c"] = max(-20.0, min(220.0, override["bearing_temp_c"] + delta_temp))
    override["vibration_rms"] = max(0.0, min(50.0, override["vibration_rms"] + delta_vib))
    override["motor_current_a"] = max(0.0, min(500.0, override["motor_current_a"] + delta_current))
    payload = {"machine_id": machine_id, "base_parameters": params, "overrides": override}
    try:
        st.session_state.latest_simulation = api_post("/simulate", payload)
        st.session_state.last_error = None
    except Exception as exc:
        st.session_state.last_error = str(exc)

if st.session_state.last_error:
    st.error(st.session_state.last_error)

health = st.session_state.health_info
if health:
    st.caption(
        f"Backend: {health.get('status', 'unknown')} | "
        f"Model: {health.get('failure_model', 'n/a')} | "
        f"Accuracy: {health.get('failure_model_accuracy', 'n/a')}"
    )

predict = st.session_state.latest_predict
if predict:
    st.subheader("Failure Prediction")
    p1, p2 = st.columns(2)
    p1.metric("Failure Probability", f"{predict['failure_probability_percent']:.2f}%")
    p2.metric("Risk Category", predict["risk_category"])

analysis = st.session_state.latest_analysis
if analysis:
    render_analysis(analysis)

sim = st.session_state.latest_simulation
if sim:
    st.subheader("Simulation Result")
    st.write(
        f"Failure probability: {sim['base_failure_probability_percent']:.2f}% -> "
        f"{sim['simulated_failure_probability_percent']:.2f}%"
    )
    st.write(f"Risk: {sim['base_risk']} -> {sim['simulated_risk']}")
    st.info(sim["impact_summary"])

history = st.session_state.history_items
if history:
    st.subheader("Recent Analysis History")
    for item in history.get("items", []):
        st.write(
            f"- {item.get('created_at', 'n/a')} | risk={item.get('risk_category', 'n/a')} | "
            f"failure={item.get('failure_probability_percent', 0):.2f}%"
        )
