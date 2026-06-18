import uuid
from typing import Optional, List
from sqlalchemy.orm import Session
from src.models.user_progress import UserProgress
from src.models.hint_usage import HintUsage


class IncidentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_progress(self, user_id: uuid.UUID) -> Optional[UserProgress]:
        return self.db.query(UserProgress).filter(UserProgress.user_id == user_id).first()

    def create_user_progress(self, user_id: uuid.UUID, current_incident_id: str) -> UserProgress:
        progress = UserProgress(
            user_id=user_id,
            current_incident_id=current_incident_id
        )
        self.db.add(progress)
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def update_current_incident(self, user_id: uuid.UUID, incident_id: str):
        progress = self.get_user_progress(user_id)
        if progress:
            progress.current_incident_id = incident_id
            self.db.commit()
        else:
            self.create_user_progress(user_id, incident_id)

    def get_hints_used(self, user_id: uuid.UUID, incident_id: str) -> List[HintUsage]:
        return self.db.query(HintUsage).filter(
            HintUsage.user_id == user_id,
            HintUsage.incident_id == incident_id
        ).order_by(HintUsage.hint_level.asc()).all()

    def add_hint_usage(self, user_id: uuid.UUID, incident_id: str, hint_level: int):
        hint = HintUsage(
            user_id=user_id,
            incident_id=incident_id,
            hint_level=hint_level
        )
        self.db.add(hint)
        
        # Also update user_progress hints_used count
        progress = self.get_user_progress(user_id)
        if progress:
            progress.hints_used += 1
            
        self.db.commit()
        return hint
