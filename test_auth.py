import bcrypt

def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        password_hash.encode("utf-8"),
    )

# Replace with the hash from your database if you can get it
test_hash = bcrypt.hashpw("password123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
print(f"Test Hash: {test_hash}")
print(f"Verification: {verify_password('password123', test_hash)}")
