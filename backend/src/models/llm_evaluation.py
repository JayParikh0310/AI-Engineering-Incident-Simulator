"""
LLM evaluation ORM model.
"""

from sqlalchemy import ForeignKey, Text, DateTime, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid

from src.db.base import Base


class LLMEvaluation(Base):
    __tablename__ = "llm_evaluations"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    attempt_id: Mapped[uuid.UUID] = mapped_column(
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
        DateTime,
        default=datetime.utcnow,
    )