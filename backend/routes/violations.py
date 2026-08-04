from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from backend.models.schemas import ViolationCreate
from backend.database.connection import db
from backend.middleware.auth import get_current_user, RoleChecker
from backend.services.email import send_email_async, send_settlement_email_async
from backend.services.pdf import generate_challan_pdf, generate_report_pdf, generate_report_csv
import asyncio
import logging

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/violations", tags=["Violations"])

@router.get("")
async def get_violations(
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = None
):
    query = {}
    if status_filter and status_filter.upper() != "ALL":
        query["status"] = status_filter.lower()
    if type_filter and type_filter.upper() != "ALL":
        query["type"] = type_filter.lower()
    if search:
        query["plate"] = {"$regex": search, "$options": "i"}
        
    data = []
    async for v in db.violations.find(query).sort("time", -1).limit(100):
        v["_id"] = str(v["_id"])
        data.append(v)
    return data

@router.post("/create")
async def create_violation_from_video(data: ViolationCreate):
    fine_map = {"no_helmet": 500, "speeding": 2000, "triple_riding": 1500, "no_seatbelt": 1000, "red_light": 1000}
    fine = fine_map.get(data.violation_type, 1000)
    
    doc = {
        "plate": data.license_plate,
        "type": data.violation_type,
        "fine": fine,
        "time": data.timestamp,
        "status": "pending",
        "location": data.location,
        "source": "video_upload",
        "ss": data.screenshot
    }
    result = await db.violations.insert_one(doc)
    
    # Send async email
    loop = asyncio.get_running_loop()
    img_path = str(Path("uploads/screenshots") / data.screenshot) if data.screenshot else ""
    asyncio.run_coroutine_threadsafe(send_email_async(data.violation_type, data.license_plate, fine, img_path), loop)
    
    return {"status": "success", "id": str(result.inserted_id)}

@router.patch("/{violation_id}/status")
async def update_violation_status(
    violation_id: str,
    status: str,
    user: dict = Depends(RoleChecker(["admin", "traffic_officer"]))
):
    """Admin/Officer: update status between 'paid' and 'pending'."""
    if status not in ("paid", "pending"):
        raise HTTPException(400, "Status must be 'paid' or 'pending'")
    try:
        oid = ObjectId(violation_id)
    except Exception:
        raise HTTPException(400, "Invalid violation ID")

    now = datetime.now().isoformat()
    update = {"status": status}
    if status == "paid":
        update["paid_at"] = now
    
    result = await db.violations.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(404, "Violation not found")
    
    v = await db.violations.find_one({"_id": oid})
    v["_id"] = str(v["_id"])
    
    if status == "paid":
        loop = asyncio.get_running_loop()
        asyncio.run_coroutine_threadsafe(
            send_settlement_email_async(v.get("type", "unknown"), v.get("plate", "UNK"), v.get("fine", 0)),
            loop
        )
        log.info(f"✅ Violation {violation_id} marked as PAID by {user.get('name')}")
        
    return {"status": "success", "violation": v}

@router.get("/{violation_id}/challan")
async def download_challan(violation_id: str):
    """Generates and serves a PDF challan download."""
    try:
        oid = ObjectId(violation_id)
    except Exception:
        raise HTTPException(400, "Invalid violation ID")
        
    violation = await db.violations.find_one({"_id": oid})
    if not violation:
        raise HTTPException(404, "Violation not found")
        
    violation["_id"] = str(violation["_id"])
    pdf_path = generate_challan_pdf(violation)
    
    return FileResponse(pdf_path, filename=f"challan_{violation_id}.pdf", media_type="application/pdf")

@router.get("/reports/download")
async def download_report(
    report_type: str = "daily",
    format_type: str = "pdf"
):
    """Generates daily/weekly/monthly report in PDF or CSV formats."""
    # Fetch active violations
    violations_list = []
    async for v in db.violations.find().sort("time", -1).limit(500):
        v["_id"] = str(v["_id"])
        violations_list.append(v)
        
    if format_type.lower() == "pdf":
        file_path = generate_report_pdf(violations_list, report_type)
        return FileResponse(file_path, filename=f"report_{report_type}.pdf", media_type="application/pdf")
    else:
        file_path = generate_report_csv(violations_list, report_type)
        return FileResponse(file_path, filename=f"report_{report_type}.csv", media_type="text/csv")
