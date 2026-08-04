from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from datetime import datetime
from backend.models.schemas import DriverRegister
from backend.database.connection import db
from backend.middleware.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])

@router.get("")
async def get_drivers(
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user)
):
    """Fetch registered drivers with search query."""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"license_plate": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
        
    drivers_list = []
    async for d in db.drivers.find(query).sort("created_at", -1).limit(100):
        d["_id"] = str(d["_id"])
        drivers_list.append(d)
        
    return {"drivers": drivers_list}

@router.post("/register")
async def register_driver(
    driver_in: DriverRegister,
    user: dict = Depends(RoleChecker(["admin", "traffic_officer"]))
):
    """Admin/Officer: register a new driver & vehicle mapping."""
    existing = await db.drivers.find_one({"license_plate": driver_in.license_plate.upper()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle plate {driver_in.license_plate.upper()} already registered to a driver"
        )
        
    driver_doc = {
        "name": driver_in.name,
        "email": driver_in.email,
        "phone": driver_in.phone,
        "license_plate": driver_in.license_plate.upper(),
        "license_number": driver_in.license_number.upper(),
        "address": driver_in.address,
        "rc_number": driver_in.rc_number.upper() if driver_in.rc_number else f"RC-{driver_in.license_plate.upper()}",
        "insurance_number": driver_in.insurance_number if driver_in.insurance_number else "INS-UNK",
        "insurance_expiry": driver_in.insurance_expiry if driver_in.insurance_expiry else (datetime.now().isoformat()),
        "photo": "",
        "created_at": datetime.now().isoformat()
    }
    
    result = await db.drivers.insert_one(driver_doc)
    driver_doc["_id"] = str(result.inserted_id)
    
    return {"message": "Driver registered successfully", "driver": driver_doc}
