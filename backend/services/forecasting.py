from datetime import datetime, timedelta
from backend.database.connection import db
import logging
from collections import defaultdict

log = logging.getLogger("backend.forecasting")

def double_exponential_smoothing(series, alpha=0.3, beta=0.1):
    """
    Computes level and trend components using Holt's Linear Trend method.
    Returns: level (L_n) and trend (T_n) at the end of the series.
    """
    n = len(series)
    if n == 0:
        return 0.0, 0.0
    if n == 1:
        return float(series[0]), 0.0

    # Initialize level and trend
    level = float(series[0])
    trend = float(series[1] - series[0])

    # Run Holt's loop
    for i in range(1, n):
        val = float(series[i])
        last_level = level
        level = alpha * val + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend

    return level, trend

async def generate_24h_forecast():
    """
    Aggregates last 24h actual violation counts, calculates Holt's parameters,
    and returns actual counts and 24h forecasts.
    """
    now = datetime.now()
    
    # 1. Learn 7-day hourly seasonality distributions
    seven_days_ago = now - timedelta(days=7)
    violations = []
    try:
        async for v in db.violations.find({"time": {"$gte": seven_days_ago.isoformat()}}, {"time": 1}):
            v_time_str = v.get("time")
            if v_time_str:
                violations.append(datetime.fromisoformat(v_time_str))
    except Exception as e:
        log.error(f"Error reading violations for forecasting: {e}")

    hourly_distribution = defaultdict(int)
    for dt in violations:
        hourly_distribution[dt.hour] += 1
        
    total_violations = len(violations)
    
    # Baseline traffic hour distributions
    baseline_seasonality = {
        0: 0.8, 1: 0.5, 2: 0.3, 3: 0.2, 4: 0.4, 5: 1.1,
        6: 2.2, 7: 3.8, 8: 5.4, 9: 6.8, 10: 5.2, 11: 4.8,
        12: 4.5, 13: 4.2, 14: 4.6, 15: 5.1, 16: 5.9, 17: 7.2,
        18: 7.8, 19: 6.4, 20: 4.2, 21: 2.8, 22: 1.8, 23: 1.2
    }
    
    seasonal_factors = {}
    for hour in range(24):
        if total_violations > 5:
            db_freq = hourly_distribution[hour] / (total_violations / 24.0)
            seasonal_factors[hour] = (db_freq * 0.75) + (baseline_seasonality[hour] * 0.25)
        else:
            # Fallback to standard curves
            seasonal_factors[hour] = baseline_seasonality[hour]

    # 2. Extract actual hourly counts for the LAST 24 Hours
    historical_data = []
    series = []
    for i in range(24, 0, -1):
        target_hour = now - timedelta(hours=i)
        start_iso = datetime(target_hour.year, target_hour.month, target_hour.day, target_hour.hour, 0, 0).isoformat()
        end_iso = datetime(target_hour.year, target_hour.month, target_hour.day, target_hour.hour, 59, 59).isoformat()
        
        try:
            count = await db.violations.count_documents({"time": {"$gte": start_iso, "$lte": end_iso}})
        except Exception:
            count = 0
            
        historical_data.append({
            "hour": target_hour.strftime("%I %p"),
            "timestamp": start_iso,
            "count": count
        })
        series.append(count)

    # 3. Calculate Holt's level and trend parameters
    L_n, T_n = double_exponential_smoothing(series, alpha=0.35, beta=0.15)
    log.info(f"📊 Double Exponential Smoothing: Level={L_n:.2f}, Trend={T_n:.2f}")

    # 4. Predict the NEXT 24 Hours
    projected_data = []
    for i in range(1, 25):
        future_hour = now + timedelta(hours=i)
        hour_val = future_hour.hour
        
        # Holt's linear trend forecast projection step: L_n + (i * T_n)
        linear_forecast = L_n + (i * T_n)
        
        # Apply seasonal scaling (daily traffic curve)
        seasonal_scale = seasonal_factors[hour_val]
        
        # Blended forecast to prevent infinite linear runaway trends
        predicted_count = (linear_forecast * 0.3) + (seasonal_scale * 2.5 * 0.7)
        
        # Ensure non-negative value
        final_count = max(0.0, round(predicted_count, 1))
        
        projected_data.append({
            "hour": future_hour.strftime("%I %p"),
            "timestamp": future_hour.isoformat(),
            "count": final_count
        })

    return {
        "historical": historical_data,
        "projected": projected_data
    }
