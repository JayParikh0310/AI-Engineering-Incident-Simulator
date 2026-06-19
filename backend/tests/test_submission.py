
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.base import Base
from src.repositories.attempt_repository import AttemptRepository
from src.models.attempt import Attempt
from src.models.attempt_file import AttemptFile
import uuid

# Set up an in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    # Only create tables relevant to the test, excluding LLMEvaluation which uses JSONB
    Attempt.__table__.create(engine)
    AttemptFile.__table__.create(engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        AttemptFile.__table__.drop(engine)
        Attempt.__table__.drop(engine)

def test_create_attempt_persistence(db):
    repo = AttemptRepository(db)
    user_id = uuid.uuid4()
    incident_id = "test-incident"
    
    # Create attempt
    attempt = repo.create_attempt(
        user_id=user_id,
        incident_id=incident_id,
        attempt_number=1,
        passed=False,
        score=0.0,
        feedback="Test feedback"
    )
    
    # Create files
    files = {"main.py": "print('hello')", "test.py": "assert True"}
    repo.create_attempt_files(attempt.id, files)
    
    # Assert
    saved_attempt = db.query(Attempt).filter(Attempt.id == attempt.id).first()
    assert saved_attempt is not None
    assert saved_attempt.incident_id == incident_id
    
    saved_files = db.query(AttemptFile).filter(AttemptFile.attempt_id == attempt.id).all()
    assert len(saved_files) == 2
    filenames = [f.filename for f in saved_files]
    assert "main.py" in filenames
    assert "test.py" in filenames
