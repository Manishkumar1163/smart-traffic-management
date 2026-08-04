from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from bson import ObjectId
import uuid
import shutil
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from backend.database.connection import db
from backend.config.settings import settings
from backend.services.cv import process_video
from backend.middleware.auth import get_current_user, RoleChecker

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["Video Uploads"])

@router.get("")
async def get_videos(user: dict = Depends(get_current_user)):
    """List all processed and processing videos."""
    videos_list = []
    async for v in db.videos.find().sort("time", -1):
        v["_id"] = str(v["_id"])
        
        # Compatibility schema mappings
        v["filename"] = v.get("file", "")
        v["location"] = v.get("loc", "")
        v["uploaded_at"] = v.get("time", "")
        v["total_detections"] = v.get("dets", 0)
        
        videos_list.append(v)
    return {"videos": videos_list}

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...), 
    location: str = Form(...),
    user: dict = Depends(RoleChecker(["admin", "traffic_officer"]))
):
    """Upload a traffic video and schedule background CV processing."""
    fname = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    path = settings.VIDEOS_DIR / fname
    
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    vid = str((await db.videos.insert_one({
        "file": file.filename,  # Save the original filename!
        "path": str(path),
        "loc": location,
        "time": datetime.now().isoformat(),
        "processed": False,
        "dets": 0
    })).inserted_id)
    
    # Process video in the background
    asyncio.create_task(process_video(vid, str(path), location))
    return {"video_id": vid, "id": vid, "status": "processing", "message": "Video upload accepted and queued"}

@router.get("/{video_id}/detections")
async def fetch_video_detections(video_id: str):
    """Fetch all OCR detections logged during a video run."""
    try:
        oid = ObjectId(video_id)
    except Exception:
        raise HTTPException(400, "Invalid video ID")
        
    v = await db.videos.find_one({"_id": oid})
    if not v or not v.get("processed"):
        return []
    
    data = []
    async for d in db.detections.find({"video": video_id}):
        d["_id"] = str(d["_id"])
        # Compatibility schema mappings
        d["license_plate"] = d.get("plate", "")
        d["violation_type"] = d.get("type", "unknown")
        d["timestamp"] = v.get("time", "")
        d["screenshot_path"] = d.get("ss", "")
        d["fine_amount"] = d.get("fine", 0)
        d["confidence_score"] = 0.92
        d["frame_number"] = 0
        data.append(d)
    return data

@router.get("/{video_id}/play")
async def play_video(video_id: str):
    """Serves the raw video file for playback."""
    try:
        oid = ObjectId(video_id)
    except Exception:
        raise HTTPException(400, "Invalid video ID")
        
    v = await db.videos.find_one({"_id": oid})
    if not v:
        raise HTTPException(404, "Video not found")
    return FileResponse(v["path"])

@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    user: dict = Depends(RoleChecker(["admin"]))
):
    """Admin only: Delete video, raw files, associated detections and violations."""
    try:
        oid = ObjectId(video_id)
    except Exception:
        raise HTTPException(400, "Invalid video ID")
        
    video = await db.videos.find_one({"_id": oid})
    if not video:
        raise HTTPException(404, "Video not found")
        
    # Delete raw file from disk
    vid_path = Path(video.get("path", ""))
    try:
        if vid_path.exists():
            vid_path.unlink()
    except Exception as e:
        log.warning(f"Could not delete video file: {e}")
        
    # Delete associated detections and their screenshot crops
    async for det in db.detections.find({"video": video_id}):
        ss_path = settings.SCREENSHOTS_DIR / det.get("ss", "")
        try:
            if ss_path.exists():
                ss_path.unlink()
        except Exception:
            pass
            
    # Cleanup database records
    await db.videos.delete_one({"_id": oid})
    await db.detections.delete_many({"video": video_id})
    await db.violations.delete_many({"ss": {"$regex": f"^{video_id}"}})
    
    return {"status": "success", "message": "Video and all associated violations deleted successfully"}
