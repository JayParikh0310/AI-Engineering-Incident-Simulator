from pydantic import BaseModel
from typing import Dict
import uuid
from datetime import datetime

class AttemptCreate(BaseModel):
    files: Dict[str, str]

class AttemptRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    incident_id: str
    attempt_number: int
    passed: bool
    score: float
    feedback: str
    created_at: datetime

    class Config:
        from_attributes = True
