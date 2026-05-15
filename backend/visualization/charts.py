"""Utility generators for frontend trend visualization data."""

from __future__ import annotations

from typing import Dict

import numpy as np
import pandas as pd
import datetime


def synthetic_timeseries(values: Dict[str, float], steps: int = 20) -> pd.DataFrame:
    rng = np.random.default_rng(10)
    idx = pd.date_range(end=pd.Timestamp.now(datetime.timezone.utc), periods=steps, freq="min")  #changed .utc() to .now(datetime.timezone.utc)
    frame = pd.DataFrame({"timestamp": idx})
    for k in ["vibration_rms", "bearing_temp_c", "motor_current_a"]:
        drift = np.linspace(-0.06, 0.08, steps) * values[k]
        noise = rng.normal(0, max(values[k] * 0.03, 0.02), steps)
        frame[k] = np.maximum(0.0, values[k] + drift + noise)
    return frame
