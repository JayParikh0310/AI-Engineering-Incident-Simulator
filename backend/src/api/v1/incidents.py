from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.models.attempt import Attempt
from src.schemas.incident_schema import IncidentCurrentResponse, IncidentHintResponse, IncidentPublic
from src.services.incident_service import IncidentService
from src.schemas.attempt_schema import AttemptCreate, AttemptRead
from src.repositories.attempt_repository import AttemptRepository
from src.repositories.incident_repository import IncidentRepository
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
    # Guard: make sure incident exists before doing anything
    incident = loader.get_incident(incident_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Incident {incident_id} not found"
        )

    # 1. Persist attempt
    repo = AttemptRepository(db)
    attempt = repo.create_attempt(
        user_id=current_user.id,
        incident_id=incident_id,
        attempt_number=repo.count_attempts(current_user.id, incident_id) + 1,
        passed=False,
        score=0.0,
        feedback="Pending evaluation"
    )
    repo.create_attempt_files(attempt.id, submission.files)

    # 2. Build incident context and run evaluation
    incident_data = {
        "title": incident.public.title,
        "scenario": incident.public.scenario,
        "logs": incident.public.logs,
        "root_cause": incident.private.root_cause.description,  # add this
        "broken_files": {                                         # add this
            name: content
            for name, content in loader.get_broken_files(incident_id).items()
            if name in incident.public.visible_files
        },
        "golden_files": {
            name: content
            for name, content in loader.get_golden_files(incident_id).items()
            if name in incident.public.visible_files
        }
    }

    evaluator = Evaluator(db)

    evaluation = evaluator.evaluate_attempt(attempt.id, incident_data, submission.files)


    # Fix 3: Update score from LLM confidence (was always 0.0)
    attempt_record = db.query(Attempt).filter(Attempt.id == attempt.id).first()
    if attempt_record:
        attempt_record.score = evaluation.confidence
        db.commit()

    # Fix 2: Update user progress on pass
    passed = evaluation.root_cause_fixed and not evaluation.introduced_new_issues
    if passed:
        progress_repo = IncidentRepository(db)
        progress = progress_repo.get_user_progress(current_user.id)
        if progress:
            # Only count as solved if this is the first time passing this incident
            previous_passes = db.query(Attempt).filter(
                Attempt.user_id == current_user.id,
                Attempt.incident_id == incident_id,
                Attempt.passed == True,
                Attempt.id != attempt.id  # exclude the current attempt
            ).count()

            if previous_passes == 0:
                progress.incidents_completed += 1

                # Advance to next incident
                all_incidents = sorted(loader.list_incidents(), key=lambda x: x.id)
                current_index = next(
                    (i for i, inc in enumerate(all_incidents) if inc.id == incident_id),
                    None
                )
                if current_index is not None and current_index + 1 < len(all_incidents):
                    progress.current_incident_id = all_incidents[current_index + 1].id

            progress.total_attempts += 1
            db.commit()

    db.refresh(attempt)
    return attempt