from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.database import get_db
from app.services.tag_service import TagService
from app.schemas.tag import TagCreate, TagUpdate, TagRead, TagList

router = APIRouter()


@router.get("", response_model=TagList)
async def list_tags(
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    return await service.get_all(search=search)


@router.post("", response_model=TagRead, status_code=201)
async def create_tag(
    data: TagCreate,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    return await service.create(data)


@router.get("/{tag_id}", response_model=TagRead)
async def get_tag(
    tag_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tag = await service.get_by_id(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: str,
    data: TagUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tag = await service.update(tag_id, data)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    deleted = await service.delete(tag_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tag not found")
