from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.services.cv import state, run_live, stream_frames
import asyncio
import threading

router = APIRouter(tags=["Live Stream"])

@router.get("/api/live/start")
async def live_start():
    if state.live:
        return {"status": "already running"}
    loop = asyncio.get_running_loop()
    threading.Thread(target=run_live, args=(loop,), daemon=True).start()
    return {"status": "started"}

@router.get("/api/live/stop")
async def live_stop():
    if not state.live:
        return {"status": "not running"}
    state.live = False
    return {"status": "stopped"}

@router.get("/stream")
async def stream():
    return StreamingResponse(stream_frames(), media_type='multipart/x-mixed-replace; boundary=frame')
