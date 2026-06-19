from pydantic import BaseModel, Field
from typing import List, Dict

class LLMEvaluationSchema(BaseModel):
    root_cause_fixed: bool
    introduced_new_issues: bool
    confidence: float = Field(ge=0, le=1)
    concepts_demonstrated: List[str]
    concepts_missing: List[str]
    summary: str
    feedback: List[str]
    recommended_skill_updates: Dict[str, int]
