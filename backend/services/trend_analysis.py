"""Trend analysis service using rolling average and slope heuristics."""

from __future__ import annotations

from typing import Dict, List

import numpy as np


def _classify_slope(series: List[float]) -> str:
    if len(series) < 3:
        return "Stable"
    x = np.arange(len(series), dtype=float)
    y = np.array(series, dtype=float)
    slope = np.polyfit(x, y, 1)[0]
    amplitude = float(np.std(y))
    mean_y = max(float(np.mean(y)), 1e-6)
    rel_slope = slope / mean_y
    if amplitude / mean_y > 0.12:
        return "Volatile"
    if rel_slope > 0.015:
        return "Rising"
    if rel_slope < -0.015:
        return "Falling"
    return "Stable"


def analyze_trends(history_rows: List[Dict], current_values: Dict[str, float]) -> List[dict]:
    focus = ["bearing_temp_c", "vibration_rms", "motor_current_a"]
    out: List[dict] = []
    for metric in focus:
        series: List[float] = []
        for row in history_rows[-14:]:
            params = row.get("input_parameters", {})
            if metric in params:
                series.append(float(params[metric]))
        series.append(float(current_values[metric]))
        trend = _classify_slope(series)
        window = series[-5:] if len(series) >= 5 else series
        rolling_avg = float(np.mean(window)) if window else float(current_values[metric])
        prev = series[-2] if len(series) > 1 else series[-1]
        change_pct = ((series[-1] - prev) / max(abs(prev), 1e-6)) * 100
        out.append(
            {
                "metric": metric,
                "trend": trend,
                "rolling_average": round(rolling_avg, 3),
                "change_percent": round(change_pct, 2),
                "detail": f"{metric} classified as {trend.lower()} over last {len(series)} readings "
                f"with latest change {change_pct:+.1f}%.",
            }
        )
    return out
