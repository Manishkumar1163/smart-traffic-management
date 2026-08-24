import pytest

@pytest.fixture
def auth_headers(client):
    # Register and log in an admin
    reg_payload = {
        "name": "Admin Test",
        "email": "admintest@traffic.com",
        "password": "adminpassword",
        "role": "admin"
    }
    client.post("/api/auth/register", json=reg_payload)
    
    login_payload = {
        "email": "admintest@traffic.com",
        "password": "adminpassword"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def viewer_headers(client):
    reg_payload = {
        "name": "Viewer Test",
        "email": "viewertest@traffic.com",
        "password": "viewerpassword",
        "role": "viewer"
    }
    client.post("/api/auth/register", json=reg_payload)
    
    login_payload = {
        "email": "viewertest@traffic.com",
        "password": "viewerpassword"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_register_driver_unauthorized(client, viewer_headers):
    driver_payload = {
        "name": "Suresh Gupta",
        "email": "suresh@example.com",
        "phone": "9876543222",
        "license_plate": "DL3CAQ1111",
        "license_number": "DL-1220200011111",
        "address": "Delhi Road, Dwarka, India"
    }
    # Viewers cannot register drivers (requires admin or officer)
    response = client.post("/api/drivers/register", json=driver_payload, headers=viewer_headers)
    assert response.status_code == 403

def test_register_driver_authorized(client, auth_headers):
    driver_payload = {
        "name": "Suresh Gupta",
        "email": "suresh@example.com",
        "phone": "9876543222",
        "license_plate": "DL3CAQ1111",
        "license_number": "DL-1220200011111",
        "address": "Delhi Road, Dwarka, India"
    }
    response = client.post("/api/drivers/register", json=driver_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Driver registered successfully"
    assert data["driver"]["name"] == "Suresh Gupta"
    assert data["driver"]["license_plate"] == "DL3CAQ1111"

def test_get_drivers_list(client, auth_headers):
    # Register a driver first to seed database
    driver_payload = {
        "name": "Suresh Gupta",
        "email": "suresh@example.com",
        "phone": "9876543222",
        "license_plate": "DL3CAQ1111",
        "license_number": "DL-1220200011111",
        "address": "Delhi Road, Dwarka, India"
    }
    client.post("/api/drivers/register", json=driver_payload, headers=auth_headers)

    # Get all drivers
    response = client.get("/api/drivers", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "drivers" in data
    assert len(data["drivers"]) >= 1

    # Search driver by plate
    response = client.get("/api/drivers?search=DL3CAQ1111", headers=auth_headers)
    data = response.json()
    assert len(data["drivers"]) == 1
    assert data["drivers"][0]["name"] == "Suresh Gupta"
