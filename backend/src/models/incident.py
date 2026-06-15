"""
Incident ORM model.
"""

from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid

from src.db.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    difficulty: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    public_spec_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    private_spec_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )