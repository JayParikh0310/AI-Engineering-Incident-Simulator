from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.schemas.incident_schema import IncidentCurrentResponse, IncidentHintResponse, IncidentPublic
from src.services.incident_service import IncidentService


router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.get("", response_model=List[IncidentPublic])
def list_incidents(
    db: Session = Depends(get_db)
):
    """
    Returns a list of all available incidents (metadata only).
    """
    return IncidentService(db).list_all_incidents()


@router.get("/current", response_model=IncidentCurrentResponse)
def get_current_incident(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current incident for the authenticated user,
    including the broken files they need to fix.
    """
    return IncidentService(db).get_current_incident(current_user.id)


@router.post("/{incident_id}/hint", response_model=IncidentHintResponse)
def get_incident_hint(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Requests a hint for a specific incident.
    Hints are tiered (Level 1, 2, etc.) and tracked in the database.
    """
    return IncidentService(db).get_hint(current_user.id, incident_id)
