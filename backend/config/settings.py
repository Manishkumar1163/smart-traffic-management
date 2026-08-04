import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    MONGODB_DB: str = os.getenv("MONGODB_DB", "traffic_ai")
    
    SMTP_SENDER: str = os.getenv("SMTP_SENDER", "mk9840508@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "ycdimyduaeudaewh")
    
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "")
    
    STOP_Y: int = 320
    MAX_SPEED: int = 60
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    VIDEOS_DIR: Path = UPLOADS_DIR / "videos"
    SCREENSHOTS_DIR: Path = UPLOADS_DIR / "screenshots"
    REPORTS_DIR: Path = BASE_DIR / "reports"
    LOGS_DIR: Path = BASE_DIR / "logs"

# Instantiate settings
settings = Settings()

# Ensure directories exist
for directory in [settings.VIDEOS_DIR, settings.SCREENSHOTS_DIR, settings.REPORTS_DIR, settings.LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
