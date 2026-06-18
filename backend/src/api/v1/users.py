from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.models.user_progress import UserProgress
from src.repositories.incident_repository import IncidentRepository
from src.schemas.user_progress_schema import UserProgressDetailResponse
from src.incident_engine.loader import loader

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me/progress", response_model=UserProgressDetailResponse)
def get_my_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    repo = IncidentRepository(db)
    progress = repo.get_user_progress(current_user.id)
    
    if not progress:
        # Create a transient object with defaults for the response
        progress = UserProgress(
            user_id=current_user.id,
            current_incident_id="fastapi-001",
            incidents_completed=0,
            total_attempts=0,
            hints_used=0
        )

    title = None
    if progress.current_incident_id:
        incident = loader.get_incident(progress.current_incident_id)
        if incident:
            title = incident.public.title

    return UserProgressDetailResponse(
        user_id=progress.user_id,
        current_incident_id=progress.current_incident_id,
        incidents_completed=progress.incidents_completed,
        total_attempts=progress.total_attempts,
        hints_used=progress.hints_used,
        updated_at=progress.updated_at or datetime.now(),
        current_incident_title=title
    )

@router.post("/me/assign/{incident_id}")
def assign_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sets the current incident for the authenticated user.
    """
    repo = IncidentRepository(db)
    # Verify incident exists
    incident = loader.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    repo.update_current_incident(current_user.id, incident_id)
    return {"status": "success", "incident_id": incident_id}
