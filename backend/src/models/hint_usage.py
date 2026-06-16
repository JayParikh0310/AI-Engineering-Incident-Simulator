import uuid
from datetime import datetime
from sqlalchemy import func

from sqlalchemy import Integer, DateTime, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class HintUsage(Base):
    __tablename__ = "hint_usage"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    incident_id: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    hint_level: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    used_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )