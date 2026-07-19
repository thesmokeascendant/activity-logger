from sqlalchemy import Column, String, Text, DateTime, Date, JSON
from datetime import datetime, timezone
import uuid

from app.db.database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    summary = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
