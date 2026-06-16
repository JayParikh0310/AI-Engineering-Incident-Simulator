from datetime import datetime, UTC
from sqlalchemy import func
import uuid

from sqlalchemy import Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class UserSkill(Base):
    __tablename__ = "user_skills"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        primary_key=True
    )

    skill_name: Mapped[str] = mapped_column(
        String,
        primary_key=True
    )

    mastery_score: Mapped[float] = mapped_column(
        Float,
        default=0
    )

    attempts_on_skill: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    successes_on_skill: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )