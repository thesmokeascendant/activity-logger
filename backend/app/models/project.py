from sqlalchemy import Column, String, Text, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=False, default="#6366f1")
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    activities = relationship("Activity", back_populates="project", cascade="all, delete-orphan")
    project_tags = relationship("ProjectTag", back_populates="project", cascade="all, delete-orphan")
