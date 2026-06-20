import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.base import Base
from src.services.report_service import ReportService
from src.models.user import User
from src.models.user_skill import UserSkill
from src.models.attempt import Attempt
import uuid

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    from src.models.user import User
    from src.models.user_skill import UserSkill
    from src.models.attempt import Attempt
    User.__table__.create(engine)
    UserSkill.__table__.create(engine)
    Attempt.__table__.create(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def test_user(db_session):
    user = User(id=uuid.uuid4(), username="testuser", email="test@example.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()
    return user

def test_get_user_progress(db_session, test_user):
    # Setup data
    skill = UserSkill(user_id=test_user.id, skill_name="python", mastery_score=5.0, attempts_on_skill=2)
    db_session.add(skill)
    
    a1 = Attempt(id=uuid.uuid4(), user_id=test_user.id, incident_id="1", attempt_number=1, passed=True, score=1.0, feedback="Great")
    a2 = Attempt(id=uuid.uuid4(), user_id=test_user.id, incident_id="2", attempt_number=1, passed=False, score=0.0, feedback="Bad")
    db_session.add_all([a1, a2])
    db_session.commit()
    
    service = ReportService(db_session)
    report = service.get_user_progress(test_user.id)
    
    assert report["total_attempts"] == 2
    assert report["passed_attempts"] == 1
    assert report["pass_rate"] == 0.5
    assert report["skills"]["python"]["mastery"] == 5.0
