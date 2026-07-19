from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timezone
import math

from app.models.activity import Activity
from app.models.tag import Tag, ActivityTag
from app.models.project import Project
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityRead, ActivityList


class ActivityService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        project_id: Optional[str] = None,
        type_filter: Optional[str] = None,
        search: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sort_by: str = "occurred_at",
        sort_dir: str = "desc",
        tag_id: Optional[str] = None,
    ) -> ActivityList:
        query = select(Activity).options(
            selectinload(Activity.project),
            selectinload(Activity.activity_tags).selectinload(ActivityTag.tag),
        )

        if project_id:
            query = query.where(Activity.project_id == project_id)
        if type_filter:
            query = query.where(Activity.type == type_filter)
        if search:
            query = query.where(
                or_(
                    Activity.title.ilike(f"%{search}%"),
                    Activity.description.ilike(f"%{search}%"),
                )
            )
        if date_from:
            query = query.where(Activity.occurred_at >= date_from)
        if date_to:
            query = query.where(Activity.occurred_at <= date_to)
        if tag_id:
            query = query.join(Activity.activity_tags).where(ActivityTag.tag_id == tag_id)

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        order_col = getattr(Activity, sort_by, Activity.occurred_at)
        if sort_dir == "desc":
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(asc(order_col))

        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        activities = result.scalars().all()

        items = [self._to_read(a) for a in activities]

        return ActivityList(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            pages=math.ceil(total / page_size) if total > 0 else 1,
        )

    async def get_by_id(self, activity_id: str) -> Optional[ActivityRead]:
        query = (
            select(Activity)
            .where(Activity.id == activity_id)
            .options(
                selectinload(Activity.project),
                selectinload(Activity.activity_tags).selectinload(ActivityTag.tag),
            )
        )
        result = await self.db.execute(query)
        activity = result.scalar_one_or_none()
        if not activity:
            return None
        return self._to_read(activity)

    async def create(self, data: ActivityCreate) -> ActivityRead:
        occurred_at = data.occurred_at or datetime.now(timezone.utc).replace(tzinfo=None)
        metadata = data.metadata_ if hasattr(data, 'metadata_') else None

        activity = Activity(
            type=data.type,
            title=data.title,
            description=data.description,
            source=data.source,
            metadata_=metadata,
            occurred_at=occurred_at,
            project_id=data.project_id,
        )
        self.db.add(activity)
        await self.db.flush()

        if data.tag_ids:
            await self._sync_tags(activity.id, data.tag_ids)

        await self.db.commit()
        return await self.get_by_id(activity.id)

    async def update(self, activity_id: str, data: ActivityUpdate) -> Optional[ActivityRead]:
        result = await self.db.execute(select(Activity).where(Activity.id == activity_id))
        activity = result.scalar_one_or_none()
        if not activity:
            return None

        if data.type is not None:
            activity.type = data.type
        if data.title is not None:
            activity.title = data.title
        if data.description is not None:
            activity.description = data.description
        if data.project_id is not None:
            activity.project_id = data.project_id
        if data.occurred_at is not None:
            activity.occurred_at = data.occurred_at
        if data.tag_ids is not None:
            await self._sync_tags(activity_id, data.tag_ids)

        await self.db.commit()
        return await self.get_by_id(activity_id)

    async def delete(self, activity_id: str) -> bool:
        result = await self.db.execute(select(Activity).where(Activity.id == activity_id))
        activity = result.scalar_one_or_none()
        if not activity:
            return False
        await self.db.delete(activity)
        await self.db.commit()
        return True

    async def _sync_tags(self, activity_id: str, tag_ids: List[str]):
        existing = await self.db.execute(
            select(ActivityTag).where(ActivityTag.activity_id == activity_id)
        )
        for at in existing.scalars().all():
            await self.db.delete(at)
        await self.db.flush()

        for tag_id in tag_ids:
            at = ActivityTag(activity_id=activity_id, tag_id=tag_id)
            self.db.add(at)

    def _to_read(self, activity: Activity) -> ActivityRead:
        tags = [at.tag for at in activity.activity_tags if at.tag]
        project = activity.project

        return ActivityRead(
            id=activity.id,
            type=activity.type,
            title=activity.title,
            description=activity.description,
            source=activity.source,
            metadata=activity.metadata_,
            occurred_at=activity.occurred_at,
            created_at=activity.created_at,
            project=project,
            tags=tags,
        )
