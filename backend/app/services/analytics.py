from collections import defaultdict
from typing import Optional

from ..models.schemas import CostFilters
from .data import load_budget, load_costs

COMPUTE = {"Virtual Machines", "Kubernetes"}

RULES = [  # first matching rule wins, so each record is counted once
    {"id": "rightsize", "title": "Rightsize underused compute", "priority": "high", "rate": 0.40,
     "match": lambda r: r["service"] in COMPUTE and r["utilization"] < 35,
     "text": "Average utilization is below 35%. Move to smaller instance sizes or fewer nodes."},
    {"id": "schedule", "title": "Shut down non-production compute off-hours", "priority": "medium", "rate": 0.35,
     "match": lambda r: r["service"] in COMPUTE and r["environment"] != "prod",
     "text": "Dev and staging compute can be stopped nights and weekends."},
    {"id": "commit", "title": "Buy reserved capacity for steady production compute", "priority": "medium", "rate": 0.30,
     "match": lambda r: r["service"] in COMPUTE and r["pricing"] == "on-demand" and r["environment"] == "prod" and r["utilization"] >= 60,
     "text": "Steady, well-used on-demand compute is a good fit for a 1-year commitment."},
    {"id": "storage", "title": "Apply storage lifecycle tiering", "priority": "low", "rate": 0.25,
     "match": lambda r: r["service"] == "Object Storage",
     "text": "Move cold objects to cheaper tiers and expire old snapshots."},
    {"id": "transfer", "title": "Reduce data transfer costs", "priority": "low", "rate": 0.20,
     "match": lambda r: r["service"] == "Data Transfer",
     "text": "Use caching/CDN, compress payloads, and keep chatty services in the same region."},
]


def options() -> dict:
    recs = load_costs()
    out = {k: sorted({r[k] for r in recs}) for k in ("service", "project", "team")}
    out["min_date"] = min((r["date"] for r in recs), default="")
    out["max_date"] = max((r["date"] for r in recs), default="")
    return out


def filter_records(f: CostFilters, ignore_dates: bool = False) -> list:
    out = []
    for r in load_costs():
        if not ignore_dates:
            if f.start_date and r["date"] < f.start_date.isoformat():
                continue
            if f.end_date and r["date"] > f.end_date.isoformat():
                continue
        if f.services and r["service"] not in f.services:
            continue
        if f.projects and r["project"] not in f.projects:
            continue
        if f.teams and r["team"] not in f.teams:
            continue
        out.append(r)
    return out


def _months() -> list:
    return sorted({r["date"][:7] for r in load_costs()})


def _group(records: list, key: str) -> dict:
    g = defaultdict(float)
    for r in records:
        g[r[key]] += r["cost"]
    return g


def suggestions(f: CostFilters) -> list:
    """Based on the latest 3 months of data (date filter ignored); savings are per month."""
    months = _months()[-3:]
    buckets = defaultdict(list)
    for r in filter_records(f, ignore_dates=True):
        if r["date"][:7] not in months:
            continue
        for rule in RULES:
            if rule["match"](r):
                buckets[rule["id"]].append(r)
                break
    out = []
    for rule in RULES:
        rs = buckets.get(rule["id"])
        if not rs:
            continue
        monthly = sum(r["cost"] for r in rs) / len(months)
        top = sorted(_group(rs, "project").items(), key=lambda kv: -kv[1])[:3]
        out.append({
            "id": rule["id"], "title": rule["title"], "description": rule["text"], "priority": rule["priority"],
            "affected_records": len(rs), "monthly_cost_affected": round(monthly, 2),
            "estimated_monthly_savings": round(monthly * rule["rate"], 2),
            "top_projects": [p for p, _ in top],
        })
    return sorted(out, key=lambda s: -s["estimated_monthly_savings"])


def summary(f: CostFilters) -> dict:
    months = _months()
    cur = months[-1] if months else ""
    prev = months[-2] if len(months) > 1 else None
    base = filter_records(f, ignore_dates=True)
    cur_total = sum(r["cost"] for r in base if r["date"][:7] == cur)
    prev_total = sum(r["cost"] for r in base if r["date"][:7] == prev) if prev else 0
    return {
        "total_spend": round(sum(r["cost"] for r in filter_records(f)), 2),
        "current_month": cur,
        "current_month_spend": round(cur_total, 2),
        "month_over_month_pct": round((cur_total - prev_total) / prev_total * 100, 1) if prev_total else None,
        "monthly_budget": load_budget()["monthly_budget"],
        "potential_monthly_savings": round(sum(s["estimated_monthly_savings"] for s in suggestions(f)), 2),
    }


def monthly_trend(f: CostFilters) -> list:
    budget = None if f.has_dimension_filters else load_budget()["monthly_budget"]
    by_month = defaultdict(float)
    for r in filter_records(f):
        by_month[r["date"][:7]] += r["cost"]
    return [{"month": m, "total": round(t, 2), "budget": budget} for m, t in sorted(by_month.items())]


def breakdown(dimension: str, f: CostFilters) -> list:
    g = _group(filter_records(f), dimension)
    total = sum(g.values()) or 1
    return [{"name": k, "total": round(v, 2), "percent": round(v / total * 100, 1)}
            for k, v in sorted(g.items(), key=lambda kv: -kv[1])]


def costs_page(f: CostFilters, q: Optional[str], sort_by: str, order: str, page: int, page_size: int) -> dict:
    recs = filter_records(f)
    if q:
        needle = q.strip().lower()
        recs = [r for r in recs if needle in " ".join(str(r[k]) for k in ("id", "date", "service", "project", "team", "environment", "pricing")).lower()]
    recs = sorted(recs, key=lambda r: (r[sort_by], r["id"]), reverse=(order == "desc"))
    start = (page - 1) * page_size
    return {"items": recs[start:start + page_size], "total": len(recs), "page": page, "page_size": page_size,
            "total_cost": round(sum(r["cost"] for r in recs), 2)}


def _state(pct: float, warning: float, critical: float) -> str:
    if pct >= 100:
        return "exceeded"
    if pct >= critical:
        return "critical"
    if pct >= warning:
        return "warning"
    return "ok"


def budget_status(warning: float, critical: float) -> dict:
    b = load_budget()
    months = _months()
    cur = months[-1] if months else ""
    recs = [r for r in load_costs() if r["date"][:7] == cur]
    spent = sum(r["cost"] for r in recs)
    by_team = _group(recs, "team")
    scopes = [("Overall", spent, b["monthly_budget"])] + [(t, by_team.get(t, 0.0), lim) for t, lim in b["team_budgets"].items()]
    rows, alerts = [], []
    for name, s, limit in scopes:
        pct = (s / limit * 100) if limit > 0 else 0.0
        st = _state(pct, warning, critical)
        rows.append({"scope": name, "budget": limit, "spent": round(s, 2), "percent_used": round(pct, 1), "status": st})
        if st != "ok":
            alerts.append({"scope": name, "level": st,
                           "message": f"{name} has used {pct:.1f}% of its ${limit:,.0f} monthly budget ({st})."})
    return {"month": cur, "thresholds": {"warning": warning, "critical": critical},
            "overall": rows[0], "teams": rows[1:], "alerts": alerts}
