from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import json

from app.models.activity import Activity
from app.models.project import Project
from app.models.tag import ActivityTag


class ExportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def export_json(self) -> dict:
        projects_result = await self.db.execute(
            select(Project).order_by(Project.name)
        )
        projects = projects_result.scalars().all()

        activities_result = await self.db.execute(
            select(Activity)
            .options(selectinload(Activity.project), selectinload(Activity.activity_tags).selectinload(ActivityTag.tag))
            .order_by(desc(Activity.occurred_at))
        )
        activities = activities_result.scalars().all()

        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "projects": [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "color": p.color,
                    "status": p.status,
                    "created_at": p.created_at.isoformat(),
                }
                for p in projects
            ],
            "activities": [
                {
                    "id": a.id,
                    "type": a.type,
                    "title": a.title,
                    "description": a.description,
                    "source": a.source,
                    "occurred_at": a.occurred_at.isoformat(),
                    "project": a.project.name if a.project else None,
                    "tags": [at.tag.name for at in a.activity_tags if at.tag],
                }
                for a in activities
            ],
        }

    async def export_markdown(self) -> str:
        data = await self.export_json()
        lines = [
            "# Activity Logger Export",
            f"\nExported: {data['exported_at']}",
            f"\n## Summary\n",
            f"- **Projects:** {len(data['projects'])}",
            f"- **Activities:** {len(data['activities'])}",
            "\n## Projects\n",
        ]

        for p in data["projects"]:
            lines.append(f"### {p['name']}")
            if p["description"]:
                lines.append(f"{p['description']}")
            lines.append(f"- Status: {p['status']}")
            lines.append(f"- Created: {p['created_at'][:10]}")
            lines.append("")

        lines.append("\n## Activity Log\n")

        current_date = None
        for a in data["activities"]:
            date = a["occurred_at"][:10]
            if date != current_date:
                lines.append(f"\n### {date}\n")
                current_date = date
            project_label = f" _[{a['project']}]_" if a["project"] else ""
            lines.append(f"- **{a['type']}**{project_label}: {a['title']}")
            if a["description"]:
                lines.append(f"  > {a['description']}")

        return "\n".join(lines)
