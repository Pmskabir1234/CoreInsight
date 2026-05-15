"""Parameter diagnostics, trend analysis, and decision logic."""

from __future__ import annotations

from typing import Dict, List, Tuple


SAFE_RANGES: Dict[str, Tuple[float, float, str]] = {
    "vibration_rms": (1.0, 7.5, "Elevated vibration suggests imbalance or bearing wear."),
    "rpm": (1200, 3600, "RPM outside nominal band can indicate load mismatch."),
    "torque_nm": (70, 280, "Torque drift may indicate coupling or process load issues."),
    "bearing_temp_c": (45, 95, "Bearing temperature rise can indicate lubrication or friction issues."),
    "ambient_temp_c": (15, 45, "Ambient conditions influence cooling efficiency."),
    "motor_current_a": (20, 110, "Increased current indicates rising electromechanical load."),
    "voltage_v": (380, 450, "Voltage deviation can cause thermal and efficiency stress."),
    "flow_rate_l_min": (280, 700, "Flow deviations can indicate blockages or leakage."),
    "pressure_bar": (3.5, 9.5, "Pressure anomalies suggest line resistance changes."),
    "humidity_percent": (25, 75, "High humidity can accelerate insulation degradation."),
}


def diagnostics(values: Dict[str, float]) -> List[dict]:
    rows: List[dict] = []
    for key, val in values.items():
        low, high, explanation = SAFE_RANGES[key]
        if low <= val <= high:
            status = "Normal"
            dev = 0.0
        else:
            distance = (low - val) if val < low else (val - high)
            span = max(high - low, 1e-6)
            dev = round((distance / span) * 100, 2)
            status = "Warning" if dev < 30 else "Critical"
        rows.append(
            {
                "parameter": key,
                "actual_value": round(float(val), 3),
                "safe_min": low,
                "safe_max": high,
                "deviation_percent": dev,
                "status": status,
                "explanation": explanation,
            }
        )
    return rows


def trend_insights(current: Dict[str, float], previous: Dict[str, float] | None) -> List[dict]:
    if not previous:
        return [
            {"metric": "bearing_temp_c", "trend": "Stable", "detail": "No prior baseline available."},
            {"metric": "vibration_rms", "trend": "Stable", "detail": "No prior baseline available."},
            {"metric": "motor_current_a", "trend": "Stable", "detail": "No prior baseline available."},
        ]
    focus = ["bearing_temp_c", "vibration_rms", "motor_current_a"]
    output: List[dict] = []
    for metric in focus:
        now = current[metric]
        prev = previous[metric]
        delta = now - prev
        pct = (delta / prev * 100.0) if prev != 0 else 0.0
        if abs(pct) < 4:
            t = "Stable"
        elif pct > 0:
            t = "Rising" if pct < 18 else "Volatile"
        else:
            t = "Falling"
        output.append(
            {
                "metric": metric,
                "trend": t,
                "detail": f"{metric} changed by {pct:.1f}% compared to previous reading.",
            }
        )
    return output


def decision_priority(
    anomaly_score: float, failure_probability_percent: float, diagnostics_rows: List[dict], trends: List[dict]
) -> Tuple[str, float]:
    critical_count = sum(1 for r in diagnostics_rows if r["status"] == "Critical")
    warning_count = sum(1 for r in diagnostics_rows if r["status"] == "Warning")
    rising_count = sum(1 for t in trends if t["trend"] in {"Rising", "Volatile"})
    combined = (
        (failure_probability_percent / 100.0) * 0.52
        + anomaly_score * 0.25
        + min(critical_count * 0.06, 0.18)
        + min(warning_count * 0.02, 0.08)
        + min(rising_count * 0.03, 0.12)
    )
    health = max(0.0, min(100.0, round((1 - combined) * 100, 2)))
    if combined < 0.22:
        return "SAFE", health
    if combined < 0.42:
        return "MONITOR", health
    if combined < 0.68:
        return "ATTENTION REQUIRED", health
    return "CRITICAL ACTION", health
