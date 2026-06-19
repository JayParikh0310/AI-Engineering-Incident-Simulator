from sqlalchemy.orm import Session
from src.models.attempt import Attempt
from src.models.attempt_file import AttemptFile
from typing import Dict

class AttemptRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_attempt(self, user_id, incident_id, attempt_number, passed, score, feedback) -> Attempt:
        attempt = Attempt(
            user_id=user_id,
            incident_id=incident_id,
            attempt_number=attempt_number,
            passed=passed,
            score=score,
            feedback=feedback
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def create_attempt_files(self, attempt_id, files: Dict[str, str]):
        for filename, content in files.items():
            attempt_file = AttemptFile(
                attempt_id=attempt_id,
                filename=filename,
                content=content
            )
            self.db.add(attempt_file)
        self.db.commit()

    def count_attempts(self, user_id, incident_id) -> int:
        return self.db.query(Attempt).filter(
            Attempt.user_id == user_id,
            Attempt.incident_id == incident_id
        ).count()
