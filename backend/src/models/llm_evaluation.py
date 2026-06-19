"""
LLM evaluation ORM model.
"""

from sqlalchemy import ForeignKey, Text, DateTime, String
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
import uuid

from src.db.base import Base


class LLMEvaluation(Base):
    __tablename__ = "llm_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    attempt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("attempts.id"),
        nullable=False,
    )

    model_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    prompt_version: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    raw_response: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    parsed_response: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),  # add this
        server_default=func.now(),
        nullable=False,
    )