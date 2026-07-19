from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.db.database import get_db
from app.services.export_service import ExportService

router = APIRouter()


@router.get("/json")
async def export_json(db: AsyncSession = Depends(get_db)):
    service = ExportService(db)
    data = await service.export_json()
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": "attachment; filename=activity-logger-export.json"},
    )


@router.get("/markdown", response_class=PlainTextResponse)
async def export_markdown(db: AsyncSession = Depends(get_db)):
    service = ExportService(db)
    content = await service.export_markdown()
    return PlainTextResponse(
        content=content,
        headers={"Content-Disposition": "attachment; filename=activity-logger-export.md"},
    )
