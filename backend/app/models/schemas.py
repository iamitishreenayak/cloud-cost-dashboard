from dataclasses import dataclass, field
from datetime import date
from typing import List, Literal, Optional

SortField = Literal["date", "service", "project", "team", "cost", "utilization", "environment", "pricing"]
SortOrder = Literal["asc", "desc"]
Dimension = Literal["service", "project", "team"]


@dataclass
class CostFilters:
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    services: List[str] = field(default_factory=list)
    projects: List[str] = field(default_factory=list)
    teams: List[str] = field(default_factory=list)

    @property
    def has_dimension_filters(self) -> bool:
        return bool(self.services or self.projects or self.teams)
