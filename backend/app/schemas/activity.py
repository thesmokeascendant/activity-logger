from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any


class TagRead(BaseModel):
    id: str
    name: str
    color: str

    model_config = {"from_attributes": True}


class ProjectRef(BaseModel):
    id: str
    name: str
    color: str

    model_config = {"from_attributes": True}


VALID_TYPES = [
    "file_edit", "git_commit", "git_push", "note", "terminal",
    "browser_visit", "project_created", "project_updated",
    "meeting", "research", "review", "deploy", "test", "build",
    "documentation", "bug_fix", "feature", "refactor", "manual"
]


class ActivityBase(BaseModel):
    type: str = Field(..., description="Activity type")
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    source: str = Field(default="manual")
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    occurred_at: Optional[datetime] = None


class ActivityCreate(ActivityBase):
    project_id: Optional[str] = None
    tag_ids: Optional[List[str]] = []

    model_config = {"populate_by_name": True}


class ActivityUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    project_id: Optional[str] = None
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    occurred_at: Optional[datetime] = None
    tag_ids: Optional[List[str]] = None

    model_config = {"populate_by_name": True}


class ActivityRead(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    source: str
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")
    occurred_at: datetime
    created_at: datetime
    project: Optional[ProjectRef] = None
    tags: List[TagRead] = []

    model_config = {"from_attributes": True, "populate_by_name": True}


class ActivityList(BaseModel):
    items: List[ActivityRead]
    total: int
    page: int
    page_size: int
    pages: int
