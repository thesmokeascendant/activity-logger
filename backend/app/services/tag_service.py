from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate, TagRead, TagList


class TagService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, search: Optional[str] = None) -> TagList:
        query = select(Tag)
        if search:
            query = query.where(Tag.name.ilike(f"%{search}%"))
        query = query.order_by(Tag.name)

        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar_one()

        result = await self.db.execute(query)
        tags = result.scalars().all()

        return TagList(items=list(tags), total=total)

    async def get_by_id(self, tag_id: str) -> Optional[TagRead]:
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        tag = result.scalar_one_or_none()
        return TagRead.model_validate(tag) if tag else None

    async def create(self, data: TagCreate) -> TagRead:
        tag = Tag(name=data.name, color=data.color)
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)
        return TagRead.model_validate(tag)

    async def update(self, tag_id: str, data: TagUpdate) -> Optional[TagRead]:
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        tag = result.scalar_one_or_none()
        if not tag:
            return None
        if data.name is not None:
            tag.name = data.name
        if data.color is not None:
            tag.color = data.color
        await self.db.commit()
        await self.db.refresh(tag)
        return TagRead.model_validate(tag)

    async def delete(self, tag_id: str) -> bool:
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        tag = result.scalar_one_or_none()
        if not tag:
            return False
        await self.db.delete(tag)
        await self.db.commit()
        return True
