import json
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@lru_cache(maxsize=1)
def load_costs() -> list:
    with open(DATA_DIR / "costs.json", encoding="utf-8") as f:
        return json.load(f)


def load_budget() -> dict:
    """Not cached, so edits to budget.json apply without restarting."""
    with open(DATA_DIR / "budget.json", encoding="utf-8") as f:
        return json.load(f)
