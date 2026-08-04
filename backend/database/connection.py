from motor.motor_asyncio import AsyncIOMotorClient
from backend.config.settings import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB]
