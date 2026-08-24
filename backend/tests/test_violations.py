import pytest

@pytest.fixture
def auth_headers(client):
    reg_payload = {
        "name": "Officer Frank",
        "email": "frank@traffic.com",
        "password": "officerpassword",
        "role": "traffic_officer"
    }
    client.post("/api/auth/register", json=reg_payload)
    
    login_payload = {
        "email": "frank@traffic.com",
        "password": "officerpassword"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def create_dummy_violation_sync(client):
    doc = {
        "plate": "MH12AB1234",
        "type": "speeding",
        "fine": 2000,
        "time": "2026-08-04T12:00:00",
        "status": "pending",
        "location": "pune",
        "source": "ai",
        "ss": "dummy_ss.jpg"
    }
    response = client.post("/api/test/insert-violation", json=doc)
    assert response.status_code == 200
    return response.json()["id"]

def test_get_violations(client):
    response = client.get("/api/violations")
    assert response.status_code == 200
    data = response.json()
    assert "violations" in data

def test_get_driver_violation_history(client):
    vid = create_dummy_violation_sync(client)
    
    response = client.get("/api/violations/driver/MH12AB1234")
    assert response.status_code == 200
    data = response.json()
    assert len(data["violations"]) >= 1
    
    target = [v for v in data["violations"] if v["_id"] == vid][0]
    assert target["license_plate"] == "MH12AB1234"
    assert target["violation_type"] == "speeding"
    assert target["fine_amount"] == 2000

def test_waive_violation(client, auth_headers):
    vid = create_dummy_violation_sync(client)
    
    response = client.put(f"/api/violations/{vid}/waive", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Check that status is paid and fine is 0
    check_response = client.get("/api/violations/driver/MH12AB1234")
    violations = check_response.json()["violations"]
    target = [v for v in violations if v["_id"] == vid][0]
    assert target["payment_status"] == "paid"
    assert target["fine_amount"] == 0
