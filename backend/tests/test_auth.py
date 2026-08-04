import pytest

def test_register_user(client):
    payload = {
        "name": "Operator Jane",
        "email": "jane@traffic.com",
        "password": "secretpassword",
        "role": "traffic_officer"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Operator Jane"
    assert data["email"] == "jane@traffic.com"
    assert data["role"] == "traffic_officer"
    assert "id" in data

def test_register_duplicate_email(client):
    payload = {
        "name": "Operator Jane Duplicate",
        "email": "jane@traffic.com",
        "password": "secretpassword",
        "role": "traffic_officer"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login_user(client):
    payload = {
        "email": "jane@traffic.com",
        "password": "secretpassword"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "traffic_officer"
    assert data["name"] == "Operator Jane"

def test_login_invalid_credentials(client):
    payload = {
        "email": "jane@traffic.com",
        "password": "wrongpassword"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_refresh_token(client):
    # Log in first
    login_payload = {
        "email": "jane@traffic.com",
        "password": "secretpassword"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    refresh_token = login_res.json()["refresh_token"]

    # Request new access token using refresh token
    refresh_payload = {
        "refresh_token": refresh_token
    }
    response = client.post("/api/auth/refresh", json=refresh_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
