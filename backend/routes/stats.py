from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from backend.database.connection import db
from backend.services.cv import state
from backend.models.schemas import SettingsUpdate
from backend.config.settings import settings
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api", tags=["System Statistics"])

@router.get("/stats")
async def stats(user: dict = Depends(get_current_user)):
    """Exposes aggregated system metrics for the dashboard & charts."""
    # 1. Total violations counts
    total_violations = await db.violations.count_documents({})
    pending_violations = await db.violations.count_documents({"status": "pending"})
    paid_violations = await db.violations.count_documents({"status": "paid"})
    
    # 2. Time-based violations (Today vs Monthly)
    now = datetime.now()
    today_start = datetime(now.year, now.month, now.day).isoformat()
    month_start = datetime(now.year, now.month, 1).isoformat()
    
    today_violations = await db.violations.count_documents({"time": {"$gte": today_start}})
    monthly_violations = await db.violations.count_documents({"time": {"$gte": month_start}})
    
    # 3. Fine metrics (Collected vs Pending)
    collected_fine = 0
    pending_fine = 0
    
    async for v in db.violations.find({"status": "paid"}, {"fine": 1}):
        collected_fine += v.get("fine", 0)
        
    async for v in db.violations.find({"status": "pending"}, {"fine": 1}):
        pending_fine += v.get("fine", 0)

    # 4. Total Drivers & Videos
    total_drivers = await db.drivers.count_documents({})
    total_videos = await db.videos.count_documents({})
    
    # 5. Active Cameras
    active_cameras = 2 if state.live else 1
    
    # 6. Violation Types Distribution
    violation_types = {
        "no_helmet": 0, "speeding": 0, "triple_riding": 0, 
        "no_seatbelt": 0, "red_light": 0, "wrong_lane": 0, 
        "wrong_direction": 0, "illegal_parking": 0
    }
    async for v in db.violations.find({}, {"type": 1}):
        t = v.get("type", "unknown")
        if t in violation_types:
            violation_types[t] += 1
        else:
            violation_types[t] = violation_types.get(t, 0) + 1
        
    # 7. Daily trend (Last 7 Days)
    daily_trend = {}
    for i in range(7):
        day_date = now - timedelta(days=i)
        day_str = day_date.strftime("%b %d")
        start = datetime(day_date.year, day_date.month, day_date.day).isoformat()
        end = datetime(day_date.year, day_date.month, day_date.day, 23, 59, 59).isoformat()
        
        count = await db.violations.count_documents({"time": {"$gte": start, "$lte": end}})
        daily_trend[day_str] = count
        
    daily_trend = dict(reversed(list(daily_trend.items())))

    # 8. Vehicle Type Distribution
    vehicle_types = {"car": 0, "bike": 0, "bus": 0, "truck": 0, "auto": 0, "person": 0}
    # Fetch from detections or sum driver registrations
    async for d in db.detections.find({}, {"type": 1, "plate": 1}):
        plate = d.get("plate", "")
        v_class = "car"
        if "MOTO" in plate or "BIKE" in plate:
            v_class = "bike"
        elif "BUS" in plate:
            v_class = "bus"
        elif "TRUCK" in plate:
            v_class = "truck"
        elif "AUTO" in plate:
            v_class = "auto"
            
        if v_class in vehicle_types:
            vehicle_types[v_class] += 1

    # Add counts from active trackers
    if state.counted_ids:
        for k, v in state.counts.items():
            if k in vehicle_types:
                vehicle_types[k] += v

    # Fallback default mock distribution if database collections are clean (first run)
    if sum(vehicle_types.values()) == 0:
        vehicle_types = {"car": 62, "bike": 48, "bus": 8, "truck": 12, "auto": 24, "person": 5}

    return {
        "total_violations": total_violations,
        "pending_violations": pending_violations,
        "paid_violations": paid_violations,
        "today_violations": today_violations,
        "monthly_violations": monthly_violations,
        
        "collected_fine": collected_fine,
        "pending_fine": pending_fine,
        "total_revenue": collected_fine,
        
        "total_drivers": total_drivers,
        "total_videos": total_videos,
        "active_cameras": active_cameras,
        
        "violation_types": violation_types,
        "daily_trend": daily_trend,
        "vehicle_types": vehicle_types
    }

@router.get("/settings")
async def get_settings():
    return {"max_speed": settings.MAX_SPEED, "live_active": state.live}

@router.post("/settings")
async def update_settings(data: SettingsUpdate):
    settings.MAX_SPEED = data.max_speed
    return {"status": "success", "max_speed": settings.MAX_SPEED}
