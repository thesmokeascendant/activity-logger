from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardStats

router = APIRouter()


@router.get("", response_model=DashboardStats)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
):
    service = DashboardService(db)
    return await service.get_stats()
