"""
Service to generate user progress reports.
"""

import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.models.user_skill import UserSkill
from src.models.attempt import Attempt
from src.models.llm_evaluation import LLMEvaluation

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_progress(self, user_id: uuid.UUID) -> dict:
        """
        Aggregates skill levels and attempt history for a user.
        """
        # Get skills
        skills = self.db.execute(
            select(UserSkill).where(UserSkill.user_id == user_id)
        ).scalars().all()
        
        skill_data = {
            s.skill_name: {
                "mastery": s.mastery_score,
                "attempts": s.attempts_on_skill
            }
            for s in skills
        }

        # Get total attempts
        total_attempts = self.db.execute(
            select(Attempt).where(Attempt.user_id == user_id)
        ).scalars().all()
        
        passed_attempts = [a for a in total_attempts if a.passed]

        return {
            "user_id": user_id,
            "skills": skill_data,
            "total_attempts": len(total_attempts),
            "passed_attempts": len(passed_attempts),
            "pass_rate": len(passed_attempts) / len(total_attempts) if total_attempts else 0.0
        }
