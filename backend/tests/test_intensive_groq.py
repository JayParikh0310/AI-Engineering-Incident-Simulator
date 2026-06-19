import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.base import Base
from src.repositories.attempt_repository import AttemptRepository
from src.evaluation_engine.evaluator import Evaluator
from src.llm.openrouter import OpenRouter
from src.models.attempt import Attempt
from src.models.llm_evaluation import LLMEvaluation
from src.models.attempt_file import AttemptFile
from typing import Dict, Any
import uuid
from dotenv import load_dotenv

# Load variables from .env
load_dotenv(dotenv_path="backend/.env")

# SQLite setup (simplified for testing)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Attempt.__table__.create(engine)
    AttemptFile.__table__.create(engine)
    # LLMEvaluation not created due to JSONB constraint in SQLite
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        AttemptFile.__table__.drop(engine)
        Attempt.__table__.drop(engine)

class TestingEvaluator(Evaluator):
    def _save_evaluation(self, attempt_id: uuid.UUID, raw: str, parsed: Dict[str, Any]):
        pass
    
    def _update_attempt(self, attempt_id: uuid.UUID, passed: bool, feedback: str):
        pass

def test_intensive_submission_pipeline(db):
    repo = AttemptRepository(db)
    user_id = uuid.uuid4()
    incident_id = "fastapi-001"
    
    # 1. Create attempt
    attempt = repo.create_attempt(user_id, incident_id, 1, False, 0.0, "Pending")
    
    # 2. Run Evaluation with Real Groq LLM but TestingEvaluator
    evaluator = TestingEvaluator(db) # Uses Groq OpenRouter class
    incident_data = {
        "title": "Orders API Startup Failure",
        "scenario": "Fix a circular import in the API.",
        "logs": ["ImportError: cannot import router"],
        "golden_files": {"main.py": "from router import router\napp.include_router(router)"}
    }
    # Payload: User fixed the circular import
    user_files = {"main.py": "from router import router\n# Fixed circular import"}
    
    print(f"\nEvaluating attempt {attempt.id}...")
    
    # This will trigger the real LLM call
    eval_result = evaluator.evaluate_attempt(attempt.id, incident_data, user_files)
    
    # 3. Assert
    print(f"Result: Passed={eval_result.root_cause_fixed and not eval_result.introduced_new_issues}, Summary={eval_result.summary}")
    assert isinstance(eval_result.root_cause_fixed, bool)
    assert len(eval_result.feedback) > 0
    print("Intensive test passed!")
