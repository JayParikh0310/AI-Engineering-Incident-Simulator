"""
Attempt ORM model.
"""

from sqlalchemy import ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
import uuid

from src.db.base import Base


class Attempt(Base):
    __tablename__ = "attempts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )

    incident_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("incidents.id"),
        nullable=False,
    )

    submission: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )