from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class IncidentScenario(BaseModel):
    service: str
    severity: Severity
    summary: str


class IncidentEvaluation(BaseModel):
    must_fix: List[str] = Field(default_factory=list)
    must_not_introduce: List[str] = Field(default_factory=list)


class IncidentPublic(BaseModel):
    id: str
    version: int
    title: str
    difficulty: Difficulty
    difficulty_score: int
    scenario: IncidentScenario
    logs: List[str]
    visible_files: List[str]
    evaluation: Optional[IncidentEvaluation] = None


class IncidentRootCause(BaseModel):
    type: str
    description: str


class IncidentSkill(BaseModel):
    name: str
    weight: float


class IncidentHint(BaseModel):
    level: int
    text: str


class IncidentPrivate(BaseModel):
    root_cause: IncidentRootCause
    skills: List[IncidentSkill]
    learning_objectives: List[str]
    hints: List[IncidentHint]


class IncidentFull(BaseModel):
    """
    Internal representation of a full incident, 
    combining data from public.json and private.json.
    """
    public: IncidentPublic
    private: IncidentPrivate


class IncidentCurrentResponse(BaseModel):
    id: str
    title: str
    difficulty: Difficulty
    scenario: IncidentScenario
    logs: List[str]
    visible_files: List[str]
    files: Dict[str, str]


class IncidentHintResponse(BaseModel):
    level: int
    text: str
