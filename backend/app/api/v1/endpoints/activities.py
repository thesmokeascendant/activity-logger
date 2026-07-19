from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.services.activity_service import ActivityService
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityRead, ActivityList

router = APIRouter()


@router.get("", response_model=ActivityList)
async def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = Query(None),
    type_filter: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    sort_by: str = Query("occurred_at"),
    sort_dir: str = Query("desc"),
    tag_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = ActivityService(db)
    return await service.get_all(
        page=page,
        page_size=page_size,
        project_id=project_id,
        type_filter=type_filter,
        search=search,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_dir=sort_dir,
        tag_id=tag_id,
    )


@router.post("", response_model=ActivityRead, status_code=201)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ActivityService(db)
    return await service.create(data)


@router.get("/{activity_id}", response_model=ActivityRead)
async def get_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ActivityService(db)
    activity = await service.get_by_id(activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
async def update_activity(
    activity_id: str,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = ActivityService(db)
    activity = await service.update(activity_id, data)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.delete("/{activity_id}", status_code=204)
async def delete_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ActivityService(db)
    deleted = await service.delete(activity_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Activity not found")
