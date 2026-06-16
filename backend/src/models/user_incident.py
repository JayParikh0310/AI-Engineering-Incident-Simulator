from datetime import datetime
import uuid

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class UserIncident(Base):
    __tablename__ = "user_incidents"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        primary_key=True
    )

    incident_id: Mapped[str] = mapped_column(
        String,
        primary_key=True
    )

    status: Mapped[str] = mapped_column(
        String
    )

    first_attempt_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    completed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=True
    )

    best_score: Mapped[float] = mapped_column(
        Float,
        default=0
    )

    attempts_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )