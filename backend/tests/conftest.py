import pytest
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.testclient import TestClient

# Override MONGODB_DB settings to keep test database separate
from backend.config.settings import settings
settings.MONGODB_DB = "traffic_ai_test"

from backend.main import app

@pytest.fixture(scope="session")
def event_loop():
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
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

@pytest.fixture(autouse=True)
def clean_collections_each_test(event_loop):
    """Synchronously purges test database entries between individual test runs."""
    async def clean():
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db_ref = client[settings.MONGODB_DB]
        # Keep base seeded admins/officers, clear other test entries
        await db_ref.users.delete_many({"email": {"$nin": ["admin@traffic.com", "officer@traffic.com", "viewer@traffic.com"]}})
        await db_ref.drivers.delete_many({})
        await db_ref.violations.delete_many({})
    event_loop.run_until_complete(clean())
    yield

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
