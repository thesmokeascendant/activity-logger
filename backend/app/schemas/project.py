from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class TagRead(BaseModel):
    id: str
    name: str
    color: str

    model_config = {"from_attributes": True}


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")
    status: str = Field(default="active")


class ProjectCreate(ProjectBase):
    tag_ids: Optional[List[str]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    status: Optional[str] = None
    tag_ids: Optional[List[str]] = None


class ProjectRead(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    activity_count: int = 0
    last_activity_at: Optional[datetime] = None
    tags: List[TagRead] = []

    model_config = {"from_attributes": True}


class ProjectList(BaseModel):
    items: List[ProjectRead]
    total: int
    page: int
    page_size: int
    pages: int
