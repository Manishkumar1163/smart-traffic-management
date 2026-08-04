import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.testclient import TestClient

# Override MONGODB_DB settings to keep test database separate
from backend.config.settings import settings
settings.MONGODB_DB = "traffic_ai_test"

from backend.main import app
from backend.database.connection import db

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def cleanup_test_db():
    # Clean up test database before session starts
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await client.drop_database("traffic_ai_test")
    yield
    # Clean up after session completes
    await client.drop_database("traffic_ai_test")

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
