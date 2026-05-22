import pytest
import requests
import os
import uuid
import time

# Use localhost for backend tests (faster, more reliable than ingress)
BASE_URL = "http://localhost:8001"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def api_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _unique_email():
    return f"test_{uuid.uuid4().hex[:10]}@timeright-test.com"


@pytest.fixture(scope="session")
def registered_user(api_session):
    """Register a fresh user once for the test session."""
    email = _unique_email()
    payload = {
        "name": "Maria Test",
        "email": email,
        "password": "senha123",
        "phone": "+5511999990000",
        "cpf": str(uuid.uuid4().int)[:11],
    }
    r = api_session.post(f"{BASE_URL}/api/auth/register", json=payload)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "email": email,
        "password": "senha123",
        "cpf": payload["cpf"],
        "token": data["access_token"],
        "user": data["user"],
    }


@pytest.fixture(scope="session")
def auth_headers(registered_user):
    return {
        "Authorization": f"Bearer {registered_user['token']}",
        "Content-Type": "application/json",
    }


@pytest.fixture(scope="session")
def future_date():
    """Return a unique future date (random offset 3-30 days) to avoid slot clashes across runs."""
    from datetime import datetime, timedelta
    import random
    offset = random.randint(3, 30)
    d = (datetime.now() + timedelta(days=offset)).date().isoformat()
    return {"date": d, "time": "15:00"}
