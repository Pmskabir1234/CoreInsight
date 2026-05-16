# backend/ml/constants.py

from typing import List

FEATURES: List[str] = [
    "vibration_rms",
    "rpm",
    "torque_nm",
    "bearing_temp_c",
    "ambient_temp_c",
    "motor_current_a",
    "voltage_v",
    "flow_rate_l_min",
    "pressure_bar",
    "humidity_percent",
]