from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ..models.schemas import CostFilters, Dimension, SortField, SortOrder
from ..services import analytics
from ..services.data import load_budget

router = APIRouter(prefix="/api")


def _parse_list(value: Optional[str], allowed: List[str], name: str) -> List[str]:
    if not value:
        return []
    items = [v.strip() for v in value.split(",") if v.strip()]
    bad = [v for v in items if v not in allowed]
    if bad:
        raise HTTPException(422, f"Unknown {name}: {', '.join(bad)}. Valid values: {', '.join(allowed)}")
    return items


def get_filters(
    start_date: Optional[date] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="YYYY-MM-DD"),
    service: Optional[str] = Query(None, description="Comma-separated services"),
    project: Optional[str] = Query(None, description="Comma-separated projects"),
    team: Optional[str] = Query(None, description="Comma-separated teams"),
) -> CostFilters:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(422, "start_date must be on or before end_date.")
    opts = analytics.options()
    return CostFilters(start_date, end_date,
                       _parse_list(service, opts["service"], "service"),
                       _parse_list(project, opts["project"], "project"),
                       _parse_list(team, opts["team"], "team"))


@router.get("/filters/options")
def filter_options():
    return analytics.options()


@router.get("/summary")
def summary(f: CostFilters = Depends(get_filters)):
    return analytics.summary(f)


@router.get("/charts/monthly")
def monthly(f: CostFilters = Depends(get_filters)):
    return analytics.monthly_trend(f)


@router.get("/charts/breakdown/{dimension}")
def breakdown(dimension: Dimension, f: CostFilters = Depends(get_filters)):
    return analytics.breakdown(dimension, f)


@router.get("/costs")
def costs(
    f: CostFilters = Depends(get_filters),
    q: Optional[str] = Query(None, max_length=100, description="Search text"),
    sort_by: SortField = "date",
    order: SortOrder = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100),
):
    return analytics.costs_page(f, q, sort_by, order, page, page_size)


@router.get("/budget")
def budget(
    warning: Optional[float] = Query(None, gt=0, le=100, description="Warning threshold, % of budget"),
    critical: Optional[float] = Query(None, gt=0, le=100, description="Critical threshold, % of budget"),
):
    defaults = load_budget()["thresholds"]
    w = defaults["warning"] if warning is None else warning
    c = defaults["critical"] if critical is None else critical
    if w >= c:
        raise HTTPException(422, "warning threshold must be lower than critical threshold.")
    return analytics.budget_status(w, c)


@router.get("/suggestions")
def suggestions(f: CostFilters = Depends(get_filters)):
    return analytics.suggestions(f)
