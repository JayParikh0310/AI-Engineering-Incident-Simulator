from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class UserProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    current_incident_id: Optional[str]
    incidents_completed: int
    total_attempts: int
    hints_used: int
    updated_at: Optional[datetime]

class UserProgressDetailResponse(UserProgressResponse):
    current_incident_title: Optional[str] = None
    completed_incident_ids: List[str] = []
