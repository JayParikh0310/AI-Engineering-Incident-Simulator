import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.db.base import Base
from src.services.skill_service import SkillService
from src.models.user import User
import uuid

# Setup in-memory DB for testing
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    # Import only necessary models
    from src.models.user import User
    from src.models.user_skill import UserSkill
    # Create only the tables we need for these tests
    User.__table__.create(engine)
    UserSkill.__table__.create(engine)
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

def test_update_user_skills_new_skill(db_session, test_user):
    service = SkillService(db_session)
    service.update_user_skills(test_user.id, {"python": 2.5})
    
    # Check if skill was created
    from src.models.user_skill import UserSkill
    skill = db_session.query(UserSkill).filter_by(user_id=test_user.id, skill_name="python").first()
    assert skill is not None
    assert skill.mastery_score == 2.5
    assert skill.attempts_on_skill == 1

def test_update_user_skills_existing_skill(db_session, test_user):
    from src.models.user_skill import UserSkill
    existing_skill = UserSkill(user_id=test_user.id, skill_name="python", mastery_score=3.0, attempts_on_skill=1)
    db_session.add(existing_skill)
    db_session.commit()
    
    service = SkillService(db_session)
    service.update_user_skills(test_user.id, {"python": 2.0})
    
    skill = db_session.query(UserSkill).filter_by(user_id=test_user.id, skill_name="python").first()
    assert skill.mastery_score == 5.0
    assert skill.attempts_on_skill == 2

def test_update_user_skills_clamping(db_session, test_user):
    from src.models.user_skill import UserSkill
    service = SkillService(db_session)
    # Test max clamp
    service.update_user_skills(test_user.id, {"python": 15.0})
    skill = db_session.query(UserSkill).filter_by(user_id=test_user.id, skill_name="python").first()
    assert skill.mastery_score == 10.0
