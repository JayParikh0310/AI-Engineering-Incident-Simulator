from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.schemas.incident_schema import IncidentCurrentResponse, IncidentHintResponse, IncidentPublic
from src.services.incident_service import IncidentService
from src.schemas.attempt_schema import AttemptCreate, AttemptRead
from src.repositories.attempt_repository import AttemptRepository
from src.evaluation_engine.evaluator import Evaluator
from src.incident_engine.loader import loader

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


@router.post("/{incident_id}/submit", response_model=AttemptRead)
def submit_attempt(
    incident_id: str,
    submission: AttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits user files for an incident.
    Persists attempt data, then triggers LLM evaluation.
    """
    # 1. Persist attempt
    repo = AttemptRepository(db)
    attempt = repo.create_attempt(
        user_id=current_user.id,
        incident_id=incident_id,
        attempt_number=1, # Need to track this properly later
        passed=False,
        score=0.0,
        feedback="Pending evaluation"
    )
    repo.create_attempt_files(attempt.id, submission.files)
    
    # 2. Trigger Evaluation (Phase 3)
    # Load incident context
    incident = loader.get_incident(incident_id)
    
    incident_data = {
        "title": incident.public.title,
        "scenario": incident.public.scenario,
        "logs": incident.public.logs,
        "golden_files": {name: content for name, content in loader.get_golden_files(incident_id).items()}
    }
    
    evaluator = Evaluator(db)
    evaluator.evaluate_attempt(str(attempt.id), incident_data, submission.files)
    
    # Re-fetch attempt to get updated pass/fail status
    db.refresh(attempt)
    return attempt
