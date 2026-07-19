from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class TagRead(TagBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TagList(BaseModel):
    items: List[TagRead]
    total: int
