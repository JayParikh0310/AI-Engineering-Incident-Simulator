import requests
import uuid

BASE_URL = "http://localhost:8000/api/v1"

def test_login_invalid_json():
    print("Testing Invalid JSON...")
    # Missing closing brace
    payload = '{"username_or_email": "jay12", "password": "jay12345"'
    response = requests.post(f"{BASE_URL}/auth/login", data=payload, headers={"Content-Type": "application/json"})
    print(f"Status: {response.status_code}, Detail: {response.text[:100]}")

def test_password_length_constraints():
    print("\nTesting Password Length Constraints...")
    # Too short
    r_short = requests.post(f"{BASE_URL}/auth/register", json={"username": f"user_{uuid.uuid4().hex[:8]}", "email": f"test_{uuid.uuid4().hex[:8]}@example.com", "password": "123"})
    print(f"Short (3 chars) Status: {r_short.status_code}, Msg: {r_short.json().get('detail')[0]['msg']}")
    
    # Too long (73 bytes)
    r_long = requests.post(f"{BASE_URL}/auth/register", json={"username": f"user_{uuid.uuid4().hex[:8]}", "email": f"test_{uuid.uuid4().hex[:8]}@example.com", "password": "a" * 73})
    print(f"Long (73 chars) Status: {r_long.status_code}, Msg: {r_long.json().get('detail')[0]['msg']}")

def test_duplicate_registration():
    print("\nTesting Duplicate Registration...")
    username = f"dup_{uuid.uuid4().hex[:8]}"
    email = f"{username}@example.com"
    # First time
    requests.post(f"{BASE_URL}/auth/register", json={"username": username, "email": email, "password": "password123"})
    # Second time (same username)
    r_dup_user = requests.post(f"{BASE_URL}/auth/register", json={"username": username, "email": "other@example.com", "password": "password123"})
    print(f"Duplicate Username Status: {r_dup_user.status_code}, Detail: {r_dup_user.json().get('detail')}")
    # Second time (same email)
    r_dup_email = requests.post(f"{BASE_URL}/auth/register", json={"username": "other_user", "email": email, "password": "password123"})
    print(f"Duplicate Email Status: {r_dup_email.status_code}, Detail: {r_dup_email.json().get('detail')}")

def test_invalid_email_format():
    print("\nTesting Invalid Email Format...")
    formats = ["plainaddress", "#@%^%#$@#$@#.com", "@example.com", "Joe Smith <email@example.com>"]
    for fmt in formats:
        r = requests.post(f"{BASE_URL}/auth/register", json={"username": "testuser", "email": fmt, "password": "password123"})
        print(f"Format '{fmt}' Status: {r.status_code}")

def test_username_patterns():
    print("\nTesting Username Patterns...")
    # Special characters not allowed in regex: r"^[a-zA-Z0-9_.-]+$"
    bad_usernames = ["user space", "user!", "user@"]
    for u in bad_usernames:
        r = requests.post(f"{BASE_URL}/auth/register", json={"username": u, "email": "test@example.com", "password": "password123"})
        print(f"Username '{u}' Status: {r.status_code}")

def test_spaces_and_trimming():
    print("\nTesting Leading/Trailing Spaces...")
    username = f" space_{uuid.uuid4().hex[:4]} "
    email = f" {username.strip()}@example.com "
    password = "  password123  "
    
    # Register with spaces
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": username.strip(), # Regex fails if we don't strip
        "email": email,
        "password": password
    })
    print(f"Register (trimmed) Status: {r.status_code}")
    
    # Login with/without spaces
    login_data = {"username_or_email": username, "password": password}
    r_login = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"Login with spaces Status: {r_login.status_code} (Expected 200 if backend trims)")

def test_case_sensitivity():
    print("\nTesting Case Sensitivity...")
    username = f"CaseUser_{uuid.uuid4().hex[:4]}"
    email = f"{username}@Example.Com"
    password = "Password123"
    
    requests.post(f"{BASE_URL}/auth/register", json={"username": username, "email": email, "password": password})
    
    # Login with lowercase email
    r_email = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": email.lower(), "password": password})
    print(f"Login Lowercase Email Status: {r_email.status_code} (Expected 200)")
    
    # Login with lowercase username (usually usernames are case-sensitive)
    r_user = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": username.lower(), "password": password})
    print(f"Login Lowercase Username Status: {r_user.status_code} (Expected 401)")

def test_security_payloads():
    print("\nTesting Security Payloads (SQLi/XSS)...")
    payloads = [
        "' OR '1'='1",
        "admin'--",
        "<script>alert(1)</script>",
        "../../etc/passwd"
    ]
    for p in payloads:
        r = requests.post(f"{BASE_URL}/auth/login", json={"username_or_email": p, "password": "somepassword"})
        print(f"Payload '{p}' Status: {r.status_code}")

def test_empty_or_whitespace_only():
    print("\nTesting Empty/Whitespace Only...")
    # Whitespace only password
    r_pw = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "spacepw", 
        "email": "spacepw@example.com", 
        "password": "        "
    })
    print(f"8 Spaces Password Status: {r_pw.status_code}")

if __name__ == "__main__":
    try:
        test_login_invalid_json()
        test_password_length_constraints()
        test_duplicate_registration()
        test_invalid_email_format()
        test_username_patterns()
        test_spaces_and_trimming()
        test_case_sensitivity()
        test_security_payloads()
        test_empty_or_whitespace_only()
    except Exception as e:
        print(f"Error connecting to backend: {e}")
