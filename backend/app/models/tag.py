from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True, index=True)
    color = Column(String(7), nullable=False, default="#6366f1")
    created_at = Column(DateTime, nullable=False, default=utcnow)

    project_tags = relationship("ProjectTag", back_populates="tag")
    activity_tags = relationship("ActivityTag", back_populates="tag")


class ProjectTag(Base):
    __tablename__ = "project_tags"

    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    project = relationship("Project", back_populates="project_tags")
    tag = relationship("Tag", back_populates="project_tags")


class ActivityTag(Base):
    __tablename__ = "activity_tags"

    activity_id = Column(String, ForeignKey("activities.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)

    activity = relationship("Activity", back_populates="activity_tags")
    tag = relationship("Tag", back_populates="activity_tags")
