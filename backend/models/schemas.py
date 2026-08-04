from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "viewer"  # viewer, traffic_officer, admin

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class ViolationCreate(BaseModel):
    video_id: str
    license_plate: str
    violation_type: str
    timestamp: str
    location: str
    screenshot: Optional[str] = None
    confidence_score: float

class SettingsUpdate(BaseModel):
    max_speed: int
