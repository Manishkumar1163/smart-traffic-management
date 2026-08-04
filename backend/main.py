import uvicorn
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config.settings import settings
from backend.routes.auth import router as auth_router, ensure_default_admin
from backend.routes.violations import router as violations_router
from backend.routes.live import router as live_router
from backend.routes.videos import router as videos_router
from backend.routes.stats import router as stats_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
log = logging.getLogger("backend")

# Initialize FastAPI App
app = FastAPI(
    title="Smart Traffic Management AI System",
    description="Full-featured B.Tech Major Project for Smart Traffic Violation Detection and Challan Settlement.",
    version="4.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Screenshot Uploads as static files
# This makes it easy to fetch full context screenshots and cropped plate images
app.mount("/screenshots", StaticFiles(directory=str(settings.SCREENSHOTS_DIR)), name="screenshots")

# Include Modular Routers
app.include_router(auth_router)
app.include_router(violations_router)
app.include_router(live_router)
app.include_router(videos_router)
app.include_router(stats_router)

@app.on_event("startup")
async def startup_event():
    log.info("🚦 Smart Traffic AI System Starting Up...")
    # Seed default admin user if not present
    await ensure_default_admin()
    log.info("✅ Database seeded with default admin credentials (admin@traffic.com / admin123).")

@app.get("/")
async def root():
    return {
        "title": "Smart Traffic System API Core",
        "status": "online",
        "documentation": "/docs",
        "stream": "/stream"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)