"""History utilities for comparison and change detection."""

from __future__ import annotations

from typing import Dict, List

import numpy as np


class HistoryService:
    def build_historical_comparison(self, history_rows: List[Dict], current_values: Dict[str, float]) -> List[dict]:
        if not history_rows:
            return [{"metric": "system", "detail": "No previous analyses available for comparison."}]

        previous = history_rows[0].get("input_parameters", {})
        comparisons: List[dict] = []
        focus_metrics = ["bearing_temp_c", "vibration_rms", "motor_current_a", "pressure_bar"]

        for metric in focus_metrics:
            now = float(current_values.get(metric, 0.0))
            prev = float(previous.get(metric, now))
            delta_pct = ((now - prev) / max(abs(prev), 1e-6)) * 100

            series = []
            for row in history_rows[:10]:
                params = row.get("input_parameters", {})
                if metric in params:
                    series.append(float(params[metric]))
            rolling_avg = float(np.mean(series)) if series else prev
            rolling_delta_pct = ((now - rolling_avg) / max(abs(rolling_avg), 1e-6)) * 100

            direction = "higher" if delta_pct >= 0 else "lower"
            comparisons.append(
                {
                    "metric": metric,
                    "previous_value": round(prev, 3),
                    "current_value": round(now, 3),
                    "change_percent": round(delta_pct, 2),
                    "rolling_average": round(rolling_avg, 3),
                    "rolling_change_percent": round(rolling_delta_pct, 2),
                    "detail": f"Current {metric} is {abs(delta_pct):.1f}% {direction} than previous reading and "
                    f"{abs(rolling_delta_pct):.1f}% relative to rolling average.",
                }
            )
        return comparisons
