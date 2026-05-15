"""Visualization generation service with error-tolerant behavior."""

from __future__ import annotations

import base64
import io
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List

import matplotlib.pyplot as plt
import numpy as np

logger = logging.getLogger(__name__)


class VisualizationService:
    def _render_plot(self, timestamps: List[datetime], values: List[float], title: str, unit: str, low: float, high: float) -> str:
        fig, ax = plt.subplots(figsize=(7.8, 3.0))
        ax.plot(timestamps, values, label=title, marker="o", linewidth=1.6, color="#1f77b4")
        moving_avg = np.convolve(np.array(values, dtype=float), np.ones(4) / 4, mode="same")
        ax.plot(timestamps, moving_avg, label="Moving average", linewidth=1.8, color="#22c55e")
        ax.axhline(low, linestyle="--", linewidth=1.0, label="Low threshold")
        ax.axhline(high, linestyle="--", linewidth=1.0, label="High threshold")
        anomalies_x = [t for t, v in zip(timestamps, values) if v < low or v > high]
        anomalies_y = [v for v in values if v < low or v > high]
        if anomalies_x:
            ax.scatter(anomalies_x, anomalies_y, color="red", s=24, label="Anomaly marker")
        ax.set_title(title)
        ax.set_xlabel("Timestamp")
        ax.set_ylabel(unit)
        ax.legend(loc="best")
        fig.autofmt_xdate()
        buffer = io.BytesIO()
        fig.tight_layout()
        fig.savefig(buffer, format="png", dpi=120)
        plt.close(fig)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    def generate_visualizations(self, values: Dict[str, float]) -> List[dict]:
        try:
            now = datetime.now(timezone.utc)
            steps = 20
            timestamps = [now - timedelta(minutes=steps - i) for i in range(steps)]
            rng = np.random.default_rng(23)
            specs = [
                ("bearing_temp_c", "Temperature Trend", "C", 45.0, 95.0),
                ("vibration_rms", "Vibration Trend", "mm/s", 1.0, 7.5),
                ("motor_current_a", "Current Trend", "A", 20.0, 110.0),
            ]
            assets: List[dict] = []
            for key, title, unit, low, high in specs:
                baseline = float(values[key])
                trend = np.linspace(-0.08, 0.1, steps) * baseline
                noise = rng.normal(0, max(0.03 * max(baseline, 1.0), 0.02), steps)
                series = np.maximum(0.0, baseline + trend + noise).tolist()
                image_b64 = self._render_plot(timestamps, series, title, unit, low, high)
                assets.append(
                    {
                        "metric": key,
                        "title": title,
                        "encoding": "base64_png",
                        "image_base64": image_b64,
                    }
                )
            return assets
        except Exception as exc:
            logger.exception("visualization_generation_failed error=%s", exc)
            return []
