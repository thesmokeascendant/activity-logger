from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.models.activity import Activity
from app.models.project import Project
from app.models.tag import Tag, ActivityTag
from app.schemas.dashboard import SearchResponse, SearchResult


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(self, query: str, limit: int = 20) -> SearchResponse:
        if not query or len(query.strip()) < 1:
            return SearchResponse(results=[], total=0, query=query)

        q = query.strip()
        results = []

        # Search activities
        act_result = await self.db.execute(
            select(Activity)
            .options(selectinload(Activity.project))
            .where(
                or_(
                    Activity.title.ilike(f"%{q}%"),
                    Activity.description.ilike(f"%{q}%"),
                )
            )
            .order_by(Activity.occurred_at.desc())
            .limit(limit)
        )
        for a in act_result.scalars().all():
            results.append(SearchResult(
                type="activity",
                id=a.id,
                title=a.title,
                subtitle=a.type,
                project_name=a.project.name if a.project else None,
                occurred_at=a.occurred_at,
            ))

        # Search projects
        proj_result = await self.db.execute(
            select(Project)
            .where(
                or_(
                    Project.name.ilike(f"%{q}%"),
                    Project.description.ilike(f"%{q}%"),
                )
            )
            .limit(limit // 2)
        )
        for p in proj_result.scalars().all():
            results.append(SearchResult(
                type="project",
                id=p.id,
                title=p.name,
                subtitle=p.description,
                created_at=p.created_at,
            ))

        # Search tags
        tag_result = await self.db.execute(
            select(Tag).where(Tag.name.ilike(f"%{q}%")).limit(5)
        )
        for t in tag_result.scalars().all():
            results.append(SearchResult(
                type="tag",
                id=t.id,
                title=t.name,
                subtitle="tag",
                created_at=t.created_at,
            ))

        results.sort(key=lambda r: (r.occurred_at or r.created_at or ""), reverse=True)

        return SearchResponse(results=results[:limit], total=len(results), query=q)
