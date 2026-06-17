"""
User persistence helpers.
"""

from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from src.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_username(self, username: str) -> User | None:
        statement = select(User).where(User.username == username)
        return self.db.execute(statement).scalar_one_or_none()

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return self.db.execute(statement).scalar_one_or_none()

    def get_by_username_or_email(self, value: str) -> User | None:
        statement = select(User).where(
            or_(User.username == value, User.email == value.lower())
        )
        return self.db.execute(statement).scalar_one_or_none()

    def create(self, username: str, email: str, password_hash: str) -> User:
        user = User(
            username=username,
            email=email.lower(),
            password_hash=password_hash,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
