from fastapi import APIRouter

from app.api.v1.endpoints import projects, activities, tags, dashboard, reports, search, export

api_router = APIRouter()

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(activities.router, prefix="/activities", tags=["Activities"])
api_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(search.router, prefix="/search", tags=["Search"])
api_router.include_router(export.router, prefix="/export", tags=["Export"])
