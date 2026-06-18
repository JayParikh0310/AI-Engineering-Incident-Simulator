import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.incident_engine.loader import loader
from src.repositories.incident_repository import IncidentRepository
from src.schemas.incident_schema import IncidentCurrentResponse, IncidentHintResponse


class IncidentService:
    def __init__(self, db: Session):
        self.repo = IncidentRepository(db)

    def get_current_incident(self, user_id: uuid.UUID) -> IncidentCurrentResponse:
        progress = self.repo.get_user_progress(user_id)
        
        incident_id = None
        if progress and progress.current_incident_id:
            incident_id = progress.current_incident_id
        else:
            # Default to first incident if none set
            all_incidents = loader.list_incidents()
            if not all_incidents:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No incidents available"
                )
            # Sort by ID to be deterministic
            all_incidents.sort(key=lambda x: x.id)
            incident_id = all_incidents[0].id
            self.repo.update_current_incident(user_id, incident_id)

        incident_full = loader.get_incident(incident_id)
        if not incident_full:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident {incident_id} not found"
            )

        broken_files = loader.get_broken_files(incident_id)
        
        # Only include files that are marked as visible
        filtered_files = {
            name: content for name, content in broken_files.items()
            if name in incident_full.public.visible_files
        }

        return IncidentCurrentResponse(
            id=incident_full.public.id,
            title=incident_full.public.title,
            difficulty=incident_full.public.difficulty,
            scenario=incident_full.public.scenario,
            logs=incident_full.public.logs,
            visible_files=incident_full.public.visible_files,
            files=filtered_files
        )

    def get_hint(self, user_id: uuid.UUID, incident_id: str) -> IncidentHintResponse:
        incident_full = loader.get_incident(incident_id)
        if not incident_full:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident {incident_id} not found"
            )

        hints_used = self.repo.get_hints_used(user_id, incident_id)
        next_level = len(hints_used) + 1

        # Find the hint with the next level
        available_hints = incident_full.private.hints
        next_hint = next((h for h in available_hints if h.level == next_level), None)

        if not next_hint:
            if not hints_used:
                 raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No hints available for this incident"
                )
            # If all hints used, return the last one again or an error?
            # API Design says "Backend decides everything". 
            # Let's return the last one for now or a message.
            last_hint = hints_used[-1]
            return IncidentHintResponse(level=last_hint.hint_level, text=available_hints[last_hint.hint_level-1].text)

        # Record hint usage
        self.repo.add_hint_usage(user_id, incident_id, next_level)

        return IncidentHintResponse(
            level=next_hint.level,
            text=next_hint.text
        )
