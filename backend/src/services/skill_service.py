"""
Service to handle user skill updates.
"""

import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.models.user_skill import UserSkill

class SkillService:
    def __init__(self, db: Session):
        self.db = db

    def update_user_skills(self, user_id: uuid.UUID, skill_updates: dict[str, float]):
        """
        Updates user skills based on LLM recommendations.
        """
        for skill_name, score_delta in skill_updates.items():
            # Get existing skill or create new
            stmt = select(UserSkill).where(
                UserSkill.user_id == user_id,
                UserSkill.skill_name == skill_name
            )
            user_skill = self.db.execute(stmt).scalar_one_or_none()

            if not user_skill:
                user_skill = UserSkill(
                    user_id=user_id,
                    skill_name=skill_name,
                    mastery_score=0.0,
                    attempts_on_skill=0
                )
                self.db.add(user_skill)

            # Update mastery_score (clamped between 0 and 10)
            # Weighted average: new score weighted 30%, history 70%
            user_skill.mastery_score = max(0.0, min(10.0,
                (user_skill.mastery_score * 0.7) + (float(score_delta) * 0.3)
            ))
            user_skill.attempts_on_skill += 1
            
        self.db.commit()
