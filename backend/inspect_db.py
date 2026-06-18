from sqlalchemy import select
from src.db.session import SessionLocal
from src.models.user import User
from src.core.security import verify_password

def inspect_users():
    db = SessionLocal()
    try:
        users = db.execute(select(User)).scalars().all()
        print(f"Total Users: {len(users)}")
        for user in users:
            print(f"ID: {user.id}, Username: {user.username}, Email: {user.email}")
            print(f"Hash: {user.password_hash}")
            if user.username == 'jay12':
                # Try verifying with common passwords you might have used
                for p in ['jay12345', 'password123']:
                    print(f"Verify '{p}': {verify_password(p, user.password_hash)}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_users()
