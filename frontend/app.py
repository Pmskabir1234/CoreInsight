"""Streamlit frontend for Innovexa engineering copilot."""

from __future__ import annotations

import base64
from typing import Dict

import pandas as pd
import plotly.graph_objects as go
import requests
import streamlit as st


API_BASE = "http://127.0.0.1:8000"


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


def build_payload(machine_id: str, params: Dict[str, float]) -> Dict:
    return {"machine_id": machine_id, "parameters": params}


def api_post(path: str, payload: Dict) -> Dict:
    response = requests.post(f"{API_BASE}{path}", json=payload, timeout=45)
    response.raise_for_status()
    return response.json()


def api_get(path: str) -> Dict:
    response = requests.get(f"{API_BASE}{path}", timeout=45)
    response.raise_for_status()
    return response.json()


def risk_color(risk: str) -> str:
    return {"Low": "#16a34a", "Medium": "#ca8a04", "High": "#ea580c", "Critical": "#dc2626"}.get(risk, "#3b82f6")


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


def time_series_card(df: pd.DataFrame, metric: str, unit: str, low: float, high: float) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=df["timestamp"], y=df[metric], mode="lines+markers", name=metric))
    fig.add_hrect(y0=low, y1=high, fillcolor="green", opacity=0.12, line_width=0)
    fig.update_layout(
        template="plotly_dark",
        title=f"{metric} trend",
        xaxis_title="Time",
        yaxis_title=unit,
        height=290,
        margin=dict(l=20, r=20, t=40, b=20),
    )
    return fig


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
st.title("CoreInsight - Stop Guessing.Start Predicting")
st.caption("Industrial Automation | Predictive Maintenance | Anomaly Detection")

if "latest_analysis" not in st.session_state:
    st.session_state.latest_analysis = None
if "chat_placeholder_idx" not in st.session_state:
    st.session_state.chat_placeholder_idx = 0
if "chat_messages" not in st.session_state:
    st.session_state.chat_messages = []

with st.sidebar:
    st.subheader("System Inputs")
    machine_id = st.text_input("Machine ID", value="MOTOR-LINE-07")
    defaults = default_params()
    st.markdown("### Mechanical")
    vibration_rms = st.number_input("Vibration RMS (mm/s)", 0.0, 50.0, defaults["vibration_rms"], help="Typical healthy range: 1.0-7.5")
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
    st.caption("Use chat command `analyze` or `/analyze` to run analysis.")

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

analysis = st.session_state.latest_analysis
if analysis:
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Failure Probability", f"{analysis['failure_probability_percent']:.2f}%")
    c2.metric("Anomaly Score", f"{analysis['anomaly_score']:.3f}")
    c3.metric("Decision Priority", analysis["decision_priority"])
    c4.metric("Risk Category", analysis["risk_category"])

    banner = f"System Status: {analysis['decision_priority']} | Risk: {analysis['risk_category']}"
    st.markdown(
        f"<div style='padding:10px;border-radius:8px;background:{risk_color(analysis['risk_category'])};color:white;'><b>{banner}</b></div>",
        unsafe_allow_html=True,
    )

    gc1, gc2 = st.columns(2)
    gc1.plotly_chart(gauge(analysis["health_score"], "Health Meter"), use_container_width=True)
    gc2.plotly_chart(gauge(analysis["failure_probability_percent"], "Risk Gauge"), use_container_width=True)

    st.subheader("Parameter Diagnostics")
    diag_df = pd.DataFrame(analysis["parameter_diagnostics"])
    st.dataframe(diag_df, use_container_width=True, hide_index=True)
    if not diag_df.empty:
        for _, row in diag_df.iterrows():
            sev_color = "#16a34a" if row["status"] == "Normal" else "#f59e0b" if row["status"] == "Warning" else "#dc2626"
            pct = min(100.0, float(row.get("deviation_percent", 0.0)))
            st.markdown(
                f"<div style='margin-bottom:6px;'>"
                f"<span style='display:inline-block;width:180px;color:{sev_color};'>{row['parameter']}</span>"
                f"<progress value='{pct}' max='100' style='width:55%;'></progress>"
                f"<span style='margin-left:8px;color:{sev_color};'>{row['status']}</span></div>",
                unsafe_allow_html=True,
            )

    st.subheader("Top Feature Importance")
    st.dataframe(pd.DataFrame(analysis["feature_importance"][:6]), use_container_width=True, hide_index=True)

    st.subheader("Trend Insights")
    for row in analysis["trend_insights"]:
        st.write(f"- **{row['metric']}**: {row['trend']} - {row['detail']}")
    if analysis.get("comparison_note"):
        st.info(analysis["comparison_note"])

    structured = analysis.get("structured_analysis", {})
    visuals = structured.get("visualizations", [])
    if visuals:
        st.subheader("Generated Trend Visualizations")
        vc1, vc2, vc3 = st.columns(3)
        cards = [vc1, vc2, vc3]
        for idx, item in enumerate(visuals[:3]):
            with cards[idx]:
                st.caption(item.get("title", item.get("metric", "Visualization")))
                try:
                    img = base64.b64decode(item["image_base64"])
                    st.image(img, use_container_width=True)
                except Exception:
                    st.warning("Unable to decode visualization image.")

    st.subheader("Engineering Decision Report")
    st.markdown(analysis["engineering_report"])
    with st.expander("Detailed Explainability"):
        for line in structured.get("root_cause_analysis", []):
            st.write(f"- {line}")
    with st.expander("Historical Comparison"):
        for item in structured.get("historical_comparison", []):
            st.write(f"- {item.get('detail', '')}")

st.divider()
st.subheader("What-if Simulation")
sc1, sc2, sc3 = st.columns(3)
delta_temp = sc1.slider("Bearing Temp Delta (C)", -30, 30, 15)
delta_vib = sc2.slider("Vibration Delta (mm/s)", -8, 8, 2)
delta_current = sc3.slider("Current Delta (A)", -50, 50, 10)
if st.button("Run Simulation"):
    override = dict(params)
    override["bearing_temp_c"] = max(-20.0, min(220.0, override["bearing_temp_c"] + delta_temp))
    override["vibration_rms"] = max(0.0, min(50.0, override["vibration_rms"] + delta_vib))
    override["motor_current_a"] = max(0.0, min(500.0, override["motor_current_a"] + delta_current))
    payload = {"machine_id": machine_id, "base_parameters": params, "overrides": override}
    try:
        sim = api_post("/simulate", payload)
        st.write(
            f"Failure probability: {sim['base_failure_probability_percent']:.2f}% -> {sim['simulated_failure_probability_percent']:.2f}%"
        )
        st.write(f"Risk: {sim['base_risk']} -> {sim['simulated_risk']}")
        st.info(sim["impact_summary"])
    except Exception as exc:
        st.error(f"Simulation failed: {exc}")

st.divider()
st.subheader("Conversational Assistant")
placeholders = [
    "Try: /analyze, /predict, /explain, /simulate, /history, /diagnostics",
    "Run /analyze to inspect machine health...",
    "Try /simulate to test parameter changes...",
    "Use /history to compare previous analyses...",
    "Run /diagnostics for detailed parameter insights...",
]
placeholder = placeholders[st.session_state.chat_placeholder_idx % len(placeholders)]
for msg in st.session_state.chat_messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_question = st.chat_input(placeholder=placeholder)
if user_question:
    st.session_state.chat_messages.append({"role": "user", "content": user_question})
    with st.chat_message("user"):
        st.markdown(user_question)
    try:
        normalized = user_question.strip().lower()
        if normalized in {"analyze", "/analyze"}:
            with st.spinner("Running local analysis pipeline..."):
                result = api_post("/analyze", build_payload(machine_id, params))
                st.session_state.latest_analysis = result
            assistant_reply = (
                f"Analysis executed for `{machine_id}`. "
                "You can now run `/diagnostics`, `/explain`, or `/history`."
            )
        else:
            answer = api_post("/chat", {"machine_id": machine_id, "message": user_question})
            assistant_reply = answer["response"]
        st.session_state.chat_messages.append({"role": "assistant", "content": assistant_reply})
        with st.chat_message("assistant"):
            st.markdown(assistant_reply)
        st.session_state.chat_placeholder_idx += 1
    except Exception as exc:
        with st.chat_message("assistant"):
            st.error(f"Chat failed: {exc}")

with st.expander("Recent Analysis History"):
    try:
        history = api_get(f"/history?machine_id={machine_id}&limit=5")
        for item in history["items"]:
            st.write(
                f"- {item['created_at']} | risk={item['risk_category']} | failure={item['failure_probability_percent']:.2f}%"
            )
    except Exception as exc:
        st.error(f"History load failed: {exc}")
