from fastapi import APIRouter
from backend.database.connection import db
from backend.config.settings import settings
from backend.services.cv import state
from backend.models.schemas import SettingsUpdate
from bson import ObjectId

router = APIRouter(prefix="/api", tags=["System Statistics"])

@router.get("/stats")
async def stats():
    tot_v = await db.violations.count_documents({})
    pend = await db.violations.count_documents({"status": "pending"})
    paid = await db.violations.count_documents({"status": "paid"})
    
    rev = 0
    async for v in db.violations.find({"status": "paid"}):
        rev += v.get("fine", 0)
    
    types = {}
    async for v in db.violations.find({}, {"type": 1}):
        t = v.get("type", "unknown")
        types[t] = types.get(t, 0) + 1
        
    return {
        "violations": tot_v,
        "pending": pend,
        "paid": paid,
        "revenue": rev,
        "types": types
    }

@router.get("/settings")
async def get_settings():
    return {"max_speed": settings.MAX_SPEED, "live_active": state.live}

@router.post("/settings")
async def update_settings(data: SettingsUpdate):
    settings.MAX_SPEED = data.max_speed
    return {"status": "success", "max_speed": settings.MAX_SPEED}
