"""
Authentication business logic.
"""

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core.security import create_access_token, hash_password, verify_password
from src.repositories.user_repository import UserRepository
from src.schemas.auth_schema import AuthResponse, UserCreate, UserLogin


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def register(self, payload: UserCreate) -> AuthResponse:
        username = payload.username.strip()
        email = str(payload.email).lower()

        if self.users.get_by_username(username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already registered",
            )

        if self.users.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        try:
            user = self.users.create(
                username=username,
                email=email,
                password_hash=hash_password(payload.password),
            )
        except IntegrityError as exc:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists",
            ) from exc

        access_token = create_access_token(subject=str(user.id))
        return AuthResponse(access_token=access_token, user=user)

    def login(self, payload: UserLogin) -> AuthResponse:
        user = self.users.get_by_username_or_email(payload.username_or_email.strip())

        if not user or not verify_password(payload.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(subject=str(user.id))
        return AuthResponse(access_token=access_token, user=user)
