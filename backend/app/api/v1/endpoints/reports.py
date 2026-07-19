from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.report_service import ReportService
from app.schemas.dashboard import ReportCreate, ReportRead, ReportList

router = APIRouter()


@router.get("", response_model=ReportList)
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = ReportService(db)
    return await service.get_all(page=page, page_size=page_size)


@router.post("", response_model=ReportRead, status_code=201)
async def generate_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ReportService(db)
    return await service.generate(data)


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ReportService(db)
    report = await service.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ReportService(db)
    deleted = await service.delete(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
