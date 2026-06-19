import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.base import Base
from src.repositories.attempt_repository import AttemptRepository
from src.evaluation_engine.evaluator import Evaluator
from src.llm.mock import MockProvider
from src.models.attempt import Attempt
from src.models.llm_evaluation import LLMEvaluation
from src.models.attempt_file import AttemptFile
from typing import Dict, Any
import uuid

# SQLite setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    # Setup tables
    Attempt.__table__.create(engine)
    AttemptFile.__table__.create(engine)
    # LLMEvaluation.__table__.create(engine) # Skip as SQLite doesn't support JSONB
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # LLMEvaluation.__table__.drop(engine)
        AttemptFile.__table__.drop(engine)
        Attempt.__table__.drop(engine)

class TestingEvaluator(Evaluator):
    def _save_evaluation(self, attempt_id: uuid.UUID, raw: str, parsed: Dict[str, Any]):
        pass
    
    def _update_attempt(self, attempt_id: uuid.UUID, passed: bool, feedback: str):
        pass

def test_pipeline_with_mock(db):
    repo = AttemptRepository(db)
    user_id = uuid.uuid4()
    incident_id = "test-incident"
    
    # 1. Create attempt
    attempt = repo.create_attempt(user_id, incident_id, 1, False, 0.0, "Pending")
    
    # 2. Run Evaluation with Mock
    # Use TestingEvaluator to avoid DB dependency issues in test
    evaluator = TestingEvaluator(db, provider=MockProvider())
    incident_data = {
        "title": "Test Incident",
        "scenario": "Fix this",
        "logs": [],
        "golden_files": {"main.py": "pass"}
    }
    user_files = {"main.py": "fixed"}
    
    eval_result = evaluator.evaluate_attempt(attempt.id, incident_data, user_files)
    
    # 3. Assert
    assert eval_result.root_cause_fixed is True
    assert "circular import" in eval_result.summary.lower() # Based on mock
