from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List, Dict, Any


class ReportCreate(BaseModel):
    type: str
    period_start: date
    period_end: date


class ReportRead(BaseModel):
    id: str
    type: str
    title: str
    period_start: date
    period_end: date
    summary: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReportList(BaseModel):
    items: List[ReportRead]
    total: int


class DailyActivityCount(BaseModel):
    date: str
    count: int


class ActivityTypeBreakdown(BaseModel):
    type: str
    count: int


class DashboardStats(BaseModel):
    today_count: int
    week_count: int
    month_count: int
    active_projects: int
    total_activities: int
    streak_days: int
    daily_trend: List[DailyActivityCount]
    type_breakdown: List[ActivityTypeBreakdown]
    busiest_hour: Optional[int] = None


class SearchResult(BaseModel):
    type: str
    id: str
    title: str
    subtitle: Optional[str] = None
    project_name: Optional[str] = None
    occurred_at: Optional[datetime] = None
    created_at: Optional[datetime] = None


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str
