from datetime import datetime
from sqlalchemy import func
import uuid

from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class UserProgress(Base):
    __tablename__ = "user_progress"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        primary_key=True
    )

    current_incident_id: Mapped[str] = mapped_column(
        String,
        nullable=True
    )

    incidents_completed: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    total_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    hints_used: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )