from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from bson import ObjectId
import uuid
import shutil
import asyncio
from datetime import datetime
from backend.database.connection import db
from backend.config.settings import settings
from backend.services.cv import process_video

router = APIRouter(prefix="/api/videos", tags=["Video Uploads"])

@router.post("/upload")
async def upload_video(file: UploadFile = File(...), location: str = Form(...)):
    fname = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    path = settings.VIDEOS_DIR / fname
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    vid = str((await db.videos.insert_one({
        "file": fname,
        "path": str(path),
        "loc": location,
        "time": datetime.now().isoformat(),
        "processed": False,
        "dets": 0
    })).inserted_id)
    
    # Process video in the background
    asyncio.create_task(process_video(vid, str(path), location))
    return {"video_id": vid, "id": vid, "status": "processing", "message": "Video accepted"}

@router.get("/{video_id}/detections")
async def fetch_video_detections(video_id: str):
    try:
        oid = ObjectId(video_id)
    except Exception:
        raise HTTPException(400, "Invalid video ID")
        
    v = await db.videos.find_one({"_id": oid})
    if not v or not v.get("processed"):
        return []
    
    data = []
    async for d in db.detections.find({"video": video_id}):
        data.append({
            "video_id": video_id,
            "license_plate": d.get("plate", ""),
            "violation_type": d.get("type", "unknown"),
            "timestamp": v["time"],
            "ss": d.get("ss", ""), # This matches the saved crop filename in DB
            "confidence_score": 0.92
        })
    return data

@router.get("/{video_id}/play")
async def play_video(video_id: str):
    try:
        oid = ObjectId(video_id)
    except Exception:
        raise HTTPException(400, "Invalid video ID")
        
    v = await db.videos.find_one({"_id": oid})
    if not v:
        raise HTTPException(404, "Video not found")
    return FileResponse(v["path"])
