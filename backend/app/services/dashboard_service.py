from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from datetime import datetime, timezone, timedelta

from app.models.activity import Activity
from app.models.project import Project
from app.schemas.dashboard import DashboardStats, DailyActivityCount, ActivityTypeBreakdown


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats(self) -> DashboardStats:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        today_count = await self._count_activities(today_start, now)
        week_count = await self._count_activities(week_start, now)
        month_count = await self._count_activities(month_start, now)

        active_projects_result = await self.db.execute(
            select(func.count()).where(Project.status == "active")
        )
        active_projects = active_projects_result.scalar_one()

        total_result = await self.db.execute(select(func.count()).select_from(Activity))
        total_activities = total_result.scalar_one()

        streak_days = await self._calculate_streak()

        daily_trend = await self._get_daily_trend(30)

        type_breakdown = await self._get_type_breakdown()

        busiest_hour = await self._get_busiest_hour()

        return DashboardStats(
            today_count=today_count,
            week_count=week_count,
            month_count=month_count,
            active_projects=active_projects,
            total_activities=total_activities,
            streak_days=streak_days,
            daily_trend=daily_trend,
            type_breakdown=type_breakdown,
            busiest_hour=busiest_hour,
        )

    async def _count_activities(self, start: datetime, end: datetime) -> int:
        result = await self.db.execute(
            select(func.count()).where(
                Activity.occurred_at >= start,
                Activity.occurred_at <= end,
            )
        )
        return result.scalar_one()

    async def _calculate_streak(self) -> int:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        streak = 0
        check_date = now.date()

        for _ in range(365):
            day_start = datetime.combine(check_date, datetime.min.time())
            day_end = datetime.combine(check_date, datetime.max.time())
            count = await self._count_activities(day_start, day_end)
            if count > 0:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        return streak

    async def _get_daily_trend(self, days: int) -> list:
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        result = []

        for i in range(days - 1, -1, -1):
            d = (now - timedelta(days=i)).date()
            day_start = datetime.combine(d, datetime.min.time())
            day_end = datetime.combine(d, datetime.max.time())

            count_result = await self.db.execute(
                select(func.count()).where(
                    Activity.occurred_at >= day_start,
                    Activity.occurred_at <= day_end,
                )
            )
            count = count_result.scalar_one()
            result.append(DailyActivityCount(date=d.isoformat(), count=count))

        return result

    async def _get_type_breakdown(self) -> list:
        result = await self.db.execute(
            select(Activity.type, func.count().label("count"))
            .group_by(Activity.type)
            .order_by(func.count().desc())
            .limit(10)
        )
        return [ActivityTypeBreakdown(type=row[0], count=row[1]) for row in result.all()]

    async def _get_busiest_hour(self):
        result = await self.db.execute(
            text(
                "SELECT CAST(strftime('%H', occurred_at) AS INTEGER) as hour, "
                "COUNT(*) as cnt FROM activities "
                "GROUP BY hour ORDER BY cnt DESC LIMIT 1"
            )
        )
        row = result.first()
        return row[0] if row else None
