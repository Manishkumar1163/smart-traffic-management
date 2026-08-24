from fastapi import APIRouter, Depends, HTTPException
from backend.services.forecasting import generate_24h_forecast
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api", tags=["B.Tech Advanced Features"])

@router.get("/forecasting")
async def get_forecasting(current_user: dict = Depends(get_current_user)):
    """Exposes 24h historical hourly counts and next 24h projected forecast."""
    try:
        data = await generate_24h_forecast()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting calculation failed: {str(e)}")
