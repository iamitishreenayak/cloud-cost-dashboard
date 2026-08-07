"""Regenerates backend/data/costs.json (seeded, deterministic). Run: python scripts/generate_sample_data.py"""
import json, random
from pathlib import Path

random.seed(42)
PROJECTS = {  # project: (team, environment)
    "web-portal": ("Platform", "prod"), "mobile-api": ("Platform", "prod"),
    "data-lake": ("Data", "prod"), "ml-training": ("Data", "dev"),
    "payments": ("Payments", "prod"), "campaign-site": ("Growth", "staging"),
}
# (project, service, base monthly cost, mean utilization %, pricing)
COMBOS = [
    ("web-portal", "Virtual Machines", 4200, 62, "on-demand"), ("web-portal", "Database", 2600, 55, "reserved"),
    ("web-portal", "Data Transfer", 1500, 50, "on-demand"), ("web-portal", "Object Storage", 900, 60, "on-demand"),
    ("mobile-api", "Kubernetes", 3800, 48, "on-demand"), ("mobile-api", "Database", 2100, 58, "reserved"),
    ("mobile-api", "Data Transfer", 1100, 50, "on-demand"),
    ("data-lake", "Object Storage", 5200, 65, "on-demand"), ("data-lake", "Analytics", 6400, 70, "on-demand"),
    ("data-lake", "Kubernetes", 2900, 41, "reserved"),
    ("ml-training", "Kubernetes", 5600, 27, "on-demand"), ("ml-training", "Object Storage", 1800, 60, "on-demand"),
    ("ml-training", "Analytics", 2200, 45, "on-demand"),
    ("payments", "Virtual Machines", 3400, 71, "on-demand"), ("payments", "Database", 4100, 66, "reserved"),
    ("payments", "Data Transfer", 900, 50, "on-demand"),
    ("campaign-site", "Virtual Machines", 1800, 22, "on-demand"), ("campaign-site", "Object Storage", 700, 55, "on-demand"),
    ("campaign-site", "Data Transfer", 1300, 50, "on-demand"),
]
MONTHS = [(2025, 10), (2025, 11), (2025, 12)] + [(2026, m) for m in range(1, 10)]
records = []
for i, (y, m) in enumerate(MONTHS):
    growth = 0.80 + 0.022 * i
    for day in (5, 20):
        for project, service, base, util, pricing in COMBOS:
            team, env = PROJECTS[project]
            records.append({
                "id": f"C-{len(records) + 1:05d}", "date": f"{y}-{m:02d}-{day:02d}",
                "service": service, "project": project, "team": team, "environment": env,
                "pricing": pricing, "utilization": max(5, min(95, round(util + random.uniform(-4, 4)))),
                "cost": round(base / 2 * growth * random.uniform(0.93, 1.07), 2),
            })
out = Path(__file__).resolve().parents[1] / "data" / "costs.json"
out.write_text(json.dumps(records, indent=1), encoding="utf-8")
print(f"Wrote {len(records)} records to {out}")
