from typing import Dict, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class AttemptCreate(BaseModel):
    files: Dict[str, str]

class AttemptRead(BaseModel):
    id: UUID
    user_id: UUID
    incident_id: str
    attempt_number: int
    passed: bool
    score: float
    feedback: str
    created_at: datetime
    recommended_skill_updates: Optional[Dict[str, float]] = None

    class Config:
        from_attributes = True