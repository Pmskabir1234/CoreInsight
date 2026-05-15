"""Lightweight SHAP-like explanation generation."""

from __future__ import annotations

from typing import Dict, List


def contribution_explanation(values: Dict[str, float], importance_rank: List[dict]) -> str:
    top = importance_rank[:3]
    lines = ["Primary contributors to risk:"]
    for idx, item in enumerate(top, start=1):
        feature = item["feature"]
        pct = item["importance_percent"]
        value = values[feature]
        lines.append(f"{idx}. {feature} -> {pct:.1f}% (current: {value:.2f})")
    lines.append("Higher-ranked features have stronger impact on model failure probability.")
    return "\n".join(lines)
