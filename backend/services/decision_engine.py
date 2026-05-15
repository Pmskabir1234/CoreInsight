"""Decision engine for priority, urgency, and recommended actions."""

from __future__ import annotations

from typing import Dict, List, Tuple


def _risk_level(prob: float) -> str:
    if prob < 20:
        return "Low"
    if prob < 45:
        return "Medium"
    if prob < 70:
        return "High"
    return "Critical"


def generate_decision_report(
    anomaly_score: float,
    failure_probability_percent: float,
    diagnostics_rows: List[dict],
    trend_rows: List[dict],
) -> Tuple[dict, List[str]]:
    critical = sum(1 for r in diagnostics_rows if r["status"] == "Critical")
    warning = sum(1 for r in diagnostics_rows if r["status"] == "Warning")
    unstable = sum(1 for r in trend_rows if r.get("trend") in {"Rising", "Volatile"})

    weighted = (
        (failure_probability_percent / 100.0) * 0.55
        + anomaly_score * 0.22
        + min(0.22, critical * 0.07)
        + min(0.10, warning * 0.02)
        + min(0.12, unstable * 0.04)
    )

    if weighted < 0.22:
        priority = "SAFE"
        urgency = "Low"
    elif weighted < 0.42:
        priority = "MONITOR"
        urgency = "Moderate"
    elif weighted < 0.68:
        priority = "ATTENTION REQUIRED"
        urgency = "High"
    else:
        priority = "CRITICAL ACTION"
        urgency = "Immediate"

    actions: List[str] = []
    dmap = {d["parameter"]: d for d in diagnostics_rows}
    if dmap.get("bearing_temp_c", {}).get("status") != "Normal":
        actions.append("Inspect bearing assembly and lubrication path within next maintenance window.")
    if dmap.get("vibration_rms", {}).get("status") != "Normal":
        actions.append("Perform shaft alignment and balance check due to vibration deviation.")
    if dmap.get("motor_current_a", {}).get("status") != "Normal":
        actions.append("Evaluate electrical loading and motor winding temperature under peak load.")
    if not actions:
        actions.append("Continue normal operation with routine monitoring and next-shift verification.")

    health_score = max(0.0, min(100.0, round((1 - weighted) * 100, 2)))
    risk_category = _risk_level(failure_probability_percent)
    summary = {
        "risk_category": risk_category,
        "decision_priority": priority,
        "urgency": urgency,
        "severity_score": round(weighted, 4),
        "health_score": health_score,
    }
    return summary, actions
