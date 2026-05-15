"""Parameter diagnostics engine with safe ranges."""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

SAFE_RANGES: Dict[str, Tuple[float, float, str]] = {
    "vibration_rms": (1.0, 7.5, "Elevated vibration suggests imbalance or bearing wear."),
    "rpm": (1200, 3600, "RPM outside nominal band can indicate load mismatch."),
    "torque_nm": (70, 280, "Torque drift may indicate coupling or process load issues."),
    "bearing_temp_c": (45, 95, "Temperature significantly exceeds safe operating limit."),
    "ambient_temp_c": (15, 45, "Ambient conditions influence cooling efficiency."),
    "motor_current_a": (20, 110, "Increased current indicates rising electromechanical load."),
    "voltage_v": (380, 450, "Voltage deviation can cause thermal and efficiency stress."),
    "flow_rate_l_min": (280, 700, "Flow deviations can indicate blockages or leakage."),
    "pressure_bar": (3.5, 9.5, "Pressure anomalies suggest line resistance changes."),
    "humidity_percent": (25, 75, "High humidity can accelerate insulation degradation."),
}


def compute_parameter_diagnostics(values: Dict[str, float], previous_values: Optional[Dict[str, float]] = None) -> List[dict]:
    rows: List[dict] = []
    for key, val in values.items():
        low, high, insight = SAFE_RANGES[key]
        deviation = 0.0
        if val < low:
            deviation = ((low - val) / max(high - low, 1e-6)) * 100
        elif val > high:
            deviation = ((val - high) / max(high - low, 1e-6)) * 100
        deviation = round(max(0.0, deviation), 2)
        status = "Normal" if deviation == 0 else "Warning" if deviation < 30 else "Critical"
        trend_note = ""
        if previous_values and key in previous_values:
            prev = float(previous_values[key])
            delta_pct = ((float(val) - prev) / max(abs(prev), 1e-6)) * 100
            trend_note = f" Compared with previous reading: {delta_pct:+.1f}%."

        rows.append(
            {
                "parameter": key,
                "value": round(float(val), 3),
                "actual_value": round(float(val), 3),
                "safe_range": f"{low}-{high}",
                "safe_min": low,
                "safe_max": high,
                "deviation_percent": deviation,
                "status": status,
                "insight": f"{insight}{trend_note}",
                "explanation": f"{insight}{trend_note}",
            }
        )
    return rows
