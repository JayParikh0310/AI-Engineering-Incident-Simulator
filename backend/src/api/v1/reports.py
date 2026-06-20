from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from src.db.session import get_db
from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/me/progress")
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ReportService(db)
    return service.get_user_progress(current_user.id)
