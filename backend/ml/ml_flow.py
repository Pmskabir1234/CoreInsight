"""Train multiple failure-prediction models, compare accuracy, plot results, persist best."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Tuple

import joblib
# import matplotlib.pyplot as plt

#

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt

#
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

from backend.ml.constants import FEATURES

logger = logging.getLogger(__name__)

MODELS_DIR = Path("models")
BEST_MODEL_PATH = MODELS_DIR / "best_failure_model.joblib"
METADATA_PATH = MODELS_DIR / "model_metadata.json"
COMPARISON_PLOT_PATH = MODELS_DIR / "model_accuracy_comparison.png"


def generate_dataset(seed: int = 42, n: int = 2000) -> Tuple[pd.DataFrame, np.ndarray]:
    """Build synthetic industrial telemetry with failure labels."""
    rng = np.random.default_rng(seed)
    data = pd.DataFrame(
        {
            "vibration_rms": rng.normal(4.5, 1.8, n).clip(0.2, 20),
            "rpm": rng.normal(2900, 420, n).clip(600, 5000),
            "torque_nm": rng.normal(180, 45, n).clip(20, 600),
            "bearing_temp_c": rng.normal(72, 14, n).clip(20, 180),
            "ambient_temp_c": rng.normal(30, 6, n).clip(10, 55),
            "motor_current_a": rng.normal(60, 15, n).clip(5, 200),
            "voltage_v": rng.normal(415, 20, n).clip(300, 500),
            "flow_rate_l_min": rng.normal(460, 90, n).clip(100, 900),
            "pressure_bar": rng.normal(6.5, 1.4, n).clip(1, 20),
            "humidity_percent": rng.normal(52, 14, n).clip(15, 95),
        }
    )
    risk_score = (
        0.30 * (data["bearing_temp_c"] / 120)
        + 0.22 * (data["vibration_rms"] / 12)
        + 0.15 * (data["motor_current_a"] / 120)
        + 0.10 * (data["pressure_bar"] / 12)
        + 0.08 * (data["torque_nm"] / 300)
        + 0.05 * np.maximum((data["rpm"] - 3500) / 2500, 0)
    )
    noise = rng.normal(0, 0.06, n)
    y = ((risk_score + noise) > 0.48).astype(int)
    return data, y


def _candidate_models(seed: int) -> Dict[str, Any]:
    return {
        "RandomForest": RandomForestClassifier(
            n_estimators=300, random_state=seed, class_weight="balanced"
        ),
        "GradientBoosting": GradientBoostingClassifier(random_state=seed),
        "LogisticRegression": Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "model",
                    LogisticRegression(max_iter=1000, random_state=seed, class_weight="balanced"),
                ),
            ]
        ),
        "SVC": Pipeline(
            [
                ("scaler", StandardScaler()),
                ("model", SVC(kernel="rbf", probability=True, random_state=seed, class_weight="balanced")),
            ]
        ),
        "KNeighbors": Pipeline(
            [
                ("scaler", StandardScaler()),
                ("model", KNeighborsClassifier(n_neighbors=7)),
            ]
        ),
    }


def plot_model_comparison(scores: Dict[str, float], best_name: str, output_path: Path) -> None:
    """Bar chart of model accuracies with best model highlighted."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    names = list(scores.keys())
    values = [scores[name] for name in names]
    colors = ["#22c55e" if name == best_name else "#3b82f6" for name in names]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.bar(names, values, color=colors)
    ax.set_ylim(0.0, 1.0)
    ax.set_ylabel("Accuracy")
    ax.set_title("Failure Prediction Model Comparison")
    ax.axhline(y=max(values), color="#16a34a", linestyle="--", linewidth=1, label="Best accuracy")
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width() / 2, val + 0.01, f"{val:.3f}", ha="center", fontsize=9)
    ax.legend(loc="lower right")
    plt.xticks(rotation=20, ha="right")
    fig.tight_layout()
    fig.savefig(output_path, dpi=140)
    plt.close(fig)
    logger.info("saved_comparison_plot path=%s", output_path)


def train_and_select_best(seed: int = 42) -> Dict[str, Any]:
    """Train all candidate models, pick highest test accuracy, save artifacts."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    data, y = generate_dataset(seed=seed)
    x = data[FEATURES]
    x_train, x_test, y_train, y_test = train_test_split(
        x, y, test_size=0.2, random_state=seed, stratify=y
    )

    scores: Dict[str, float] = {}
    fitted: Dict[str, Any] = {}
    for name, model in _candidate_models(seed).items():
        model.fit(x_train, y_train)
        preds = model.predict(x_test)
        acc = float(accuracy_score(y_test, preds))
        scores[name] = round(acc, 4)
        fitted[name] = model
        logger.info("model_trained name=%s accuracy=%.4f", name, acc)

    best_name = max(scores, key=scores.get)
    best_model = fitted[best_name]
    best_accuracy = scores[best_name]

    plot_model_comparison(scores, best_name, COMPARISON_PLOT_PATH)
    joblib.dump(best_model, BEST_MODEL_PATH)

    metadata = {
        "best_model": best_name,
        "best_accuracy": best_accuracy,
        "all_scores": scores,
        "features": FEATURES,
        "comparison_plot": str(COMPARISON_PLOT_PATH),
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    logger.info("best_model_selected name=%s accuracy=%.4f", best_name, best_accuracy)
    return metadata


def load_best_failure_model() -> Tuple[Any | None, Dict[str, Any]]:
    """Load persisted best model and metadata if available."""
    if not BEST_MODEL_PATH.exists():
        return None, {}
    model = joblib.load(BEST_MODEL_PATH)
    metadata: Dict[str, Any] = {}
    if METADATA_PATH.exists():
        metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    return model, metadata


def ensure_trained(seed: int = 42) -> Dict[str, Any]:
    """Train only when artifacts are missing."""
    if BEST_MODEL_PATH.exists() and METADATA_PATH.exists():
        return json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    return train_and_select_best(seed=seed)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_and_select_best()
    print(json.dumps(result, indent=2))
