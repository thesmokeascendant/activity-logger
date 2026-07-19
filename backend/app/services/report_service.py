from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from datetime import date, datetime, timedelta
from typing import Optional
import math

from app.models.report import Report
from app.models.activity import Activity
from app.models.project import Project
from app.schemas.dashboard import ReportCreate, ReportRead, ReportList


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, page: int = 1, page_size: int = 20) -> ReportList:
        total_result = await self.db.execute(select(func.count()).select_from(Report))
        total = total_result.scalar_one()

        result = await self.db.execute(
            select(Report).order_by(desc(Report.created_at)).offset((page - 1) * page_size).limit(page_size)
        )
        reports = result.scalars().all()

        return ReportList(items=list(reports), total=total)

    async def get_by_id(self, report_id: str) -> Optional[ReportRead]:
        result = await self.db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        return ReportRead.model_validate(report) if report else None

    async def generate(self, data: ReportCreate) -> ReportRead:
        start = datetime.combine(data.period_start, datetime.min.time())
        end = datetime.combine(data.period_end, datetime.max.time())

        activities_result = await self.db.execute(
            select(Activity)
            .where(Activity.occurred_at >= start, Activity.occurred_at <= end)
            .options(selectinload(Activity.project))
            .order_by(desc(Activity.occurred_at))
        )
        activities = activities_result.scalars().all()

        type_counts: dict = {}
        project_counts: dict = {}
        project_names: dict = {}

        for a in activities:
            type_counts[a.type] = type_counts.get(a.type, 0) + 1
            if a.project_id:
                project_counts[a.project_id] = project_counts.get(a.project_id, 0) + 1
                if a.project:
                    project_names[a.project_id] = a.project.name

        top_projects = sorted(project_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        period_label = {
            "daily": f"{data.period_start.strftime('%B %d, %Y')}",
            "weekly": f"Week of {data.period_start.strftime('%B %d')} – {data.period_end.strftime('%B %d, %Y')}",
            "monthly": f"{data.period_start.strftime('%B %Y')}",
        }.get(data.type, f"{data.period_start} to {data.period_end}")

        title = f"{data.type.capitalize()} Report — {period_label}"

        summary_lines = [
            f"Total activities: {len(activities)}",
            f"Active projects: {len(project_counts)}",
        ]
        if type_counts:
            top_type = max(type_counts, key=type_counts.get)
            summary_lines.append(f"Most common activity type: {top_type} ({type_counts[top_type]})")
        if top_projects:
            top_pid, top_count = top_projects[0]
            summary_lines.append(f"Most active project: {project_names.get(top_pid, top_pid)} ({top_count} activities)")

        report_data = {
            "activity_count": len(activities),
            "type_breakdown": [{"type": k, "count": v} for k, v in sorted(type_counts.items(), key=lambda x: x[1], reverse=True)],
            "top_projects": [
                {"id": pid, "name": project_names.get(pid, pid), "count": cnt}
                for pid, cnt in top_projects
            ],
            "activities": [
                {
                    "id": a.id,
                    "type": a.type,
                    "title": a.title,
                    "occurred_at": a.occurred_at.isoformat(),
                    "project": a.project.name if a.project else None,
                }
                for a in activities[:50]
            ],
        }

        report = Report(
            type=data.type,
            title=title,
            period_start=data.period_start,
            period_end=data.period_end,
            summary="\n".join(summary_lines),
            data=report_data,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)
        return ReportRead.model_validate(report)

    async def delete(self, report_id: str) -> bool:
        result = await self.db.execute(select(Report).where(Report.id == report_id))
        report = result.scalar_one_or_none()
        if not report:
            return False
        await self.db.delete(report)
        await self.db.commit()
        return True
