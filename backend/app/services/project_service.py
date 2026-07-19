from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
import math

from app.models.project import Project
from app.models.activity import Activity
from app.models.tag import Tag, ProjectTag
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectRead, ProjectList


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_dir: str = "desc",
    ) -> ProjectList:
        query = select(Project).options(
            selectinload(Project.project_tags).selectinload(ProjectTag.tag)
        )

        if status:
            query = query.where(Project.status == status)
        if search:
            query = query.where(
                or_(
                    Project.name.ilike(f"%{search}%"),
                    Project.description.ilike(f"%{search}%"),
                )
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        order_col = getattr(Project, sort_by, Project.updated_at)
        if sort_dir == "desc":
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(order_col)

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        projects = result.scalars().all()

        items = []
        for project in projects:
            project_data = await self._enrich_project(project)
            items.append(project_data)

        return ProjectList(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=math.ceil(total / page_size) if total > 0 else 1,
        )

    async def get_by_id(self, project_id: str) -> Optional[ProjectRead]:
        query = select(Project).where(Project.id == project_id).options(
            selectinload(Project.project_tags).selectinload(ProjectTag.tag)
        )
        result = await self.db.execute(query)
        project = result.scalar_one_or_none()
        if not project:
            return None
        return await self._enrich_project(project)

    async def create(self, data: ProjectCreate) -> ProjectRead:
        project = Project(
            name=data.name,
            description=data.description,
            color=data.color,
            status=data.status,
        )
        self.db.add(project)
        await self.db.flush()

        if data.tag_ids:
            await self._sync_tags(project.id, data.tag_ids)

        await self.db.commit()
        await self.db.refresh(project)
        return await self.get_by_id(project.id)

    async def update(self, project_id: str, data: ProjectUpdate) -> Optional[ProjectRead]:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            return None

        if data.name is not None:
            project.name = data.name
        if data.description is not None:
            project.description = data.description
        if data.color is not None:
            project.color = data.color
        if data.status is not None:
            project.status = data.status

        if data.tag_ids is not None:
            await self._sync_tags(project_id, data.tag_ids)

        await self.db.commit()
        await self.db.refresh(project)
        return await self.get_by_id(project.id)

    async def delete(self, project_id: str) -> bool:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            return False
        await self.db.delete(project)
        await self.db.commit()
        return True

    async def _sync_tags(self, project_id: str, tag_ids: List[str]):
        existing = await self.db.execute(
            select(ProjectTag).where(ProjectTag.project_id == project_id)
        )
        for pt in existing.scalars().all():
            await self.db.delete(pt)
        await self.db.flush()

        for tag_id in tag_ids:
            pt = ProjectTag(project_id=project_id, tag_id=tag_id)
            self.db.add(pt)

    async def _enrich_project(self, project: Project) -> ProjectRead:
        count_result = await self.db.execute(
            select(func.count()).where(Activity.project_id == project.id)
        )
        activity_count = count_result.scalar_one()

        last_activity_result = await self.db.execute(
            select(Activity.occurred_at)
            .where(Activity.project_id == project.id)
            .order_by(desc(Activity.occurred_at))
            .limit(1)
        )
        last_activity_at = last_activity_result.scalar_one_or_none()

        tags = [pt.tag for pt in project.project_tags if pt.tag]

        return ProjectRead(
            id=project.id,
            name=project.name,
            description=project.description,
            color=project.color,
            status=project.status,
            created_at=project.created_at,
            updated_at=project.updated_at,
            activity_count=activity_count,
            last_activity_at=last_activity_at,
            tags=tags,
        )
