from fastapi import APIRouter, HTTPException, Depends, status
from backend.models.schemas import UserRegister, UserLogin, Token, UserResponse, RefreshTokenRequest
from backend.database.connection import db
from backend.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from backend.middleware.auth import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

async def ensure_default_admin():
    """Checks if default admin exists; if not, inserts one."""
    admin = await db.users.find_one({"email": "admin@traffic.com"})
    if not admin:
        hashed = hash_password("admin123")
        await db.users.insert_one({
            "name": "System Administrator",
            "email": "admin@traffic.com",
            "password": hashed,
            "role": "admin"
        })

@router.post("/register", response_model=UserResponse)
async def register(user_in: UserRegister):
    existing = await db.users.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed = hash_password(user_in.password)
    user_doc = {
        "name": user_in.name,
        "email": user_in.email,
        "password": hashed,
        "role": user_in.role
    }
    result = await db.users.insert_one(user_doc)
    
    return {
        "id": str(result.inserted_id),
        "name": user_in.name,
        "email": user_in.email,
        "role": user_in.role
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    user_id = str(user["_id"])
    role = user.get("role", "viewer")
    name = user.get("name", "User")
    
    access_token = create_access_token(subject=user_id, role=role, name=name)
    refresh_token = create_refresh_token(subject=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role,
        "name": name
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user.get("name", ""),
        "email": current_user.get("email", ""),
        "role": current_user.get("role", "viewer")
    }

@router.post("/refresh", response_model=Token)
async def refresh(req: RefreshTokenRequest):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    user_id = payload.get("sub")
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with refresh token not found"
        )
        
    user_id = str(user["_id"])
    role = user.get("role", "viewer")
    name = user.get("name", "User")
    
    access_token = create_access_token(subject=user_id, role=role, name=name)
    refresh_token = create_refresh_token(subject=user_id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role,
        "name": name
    }
