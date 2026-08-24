import logging
from datetime import datetime
from backend.database.connection import db
from backend.services.email import send_email_async
from backend.services.telegram_bot import send_telegram_alert

log = logging.getLogger("backend.notifier")

async def dispatch_violation_alerts(
    v_id: str, 
    plate: str, 
    vtype: str, 
    fine: int, 
    img_path: str
):
    """
    Implements workflow:
    Driver Lookup -> Telegram Notification -> Email Notification
    """
    log.info(f"🔔 Starting alert dispatch workflow for plate={plate}, violation={vtype}")
    
    # 1. Driver Lookup in MongoDB
    driver_email = f"{plate.lower()}@example.com"
    try:
        driver = await db.drivers.find_one({"license_plate": plate.upper()})
        if driver:
            if driver.get("email"):
                driver_email = driver["email"]
                log.info(f"Driver resolved in DB: {driver.get('name')} ({driver_email})")
    except Exception as e:
        log.error(f"Failed to lookup driver for plate {plate}: {e}")

    # Generate details
    time_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payment_link = f"http://localhost:3000/pay/{v_id}"

    # 2. Trigger Telegram Bot Notification
    try:
        await send_telegram_alert(
            plate=plate, 
            vtype=vtype, 
            fine=fine, 
            time_str=time_str, 
            payment_link=payment_link, 
            photo_path=img_path
        )
    except Exception as e:
        log.error(f"Failed to dispatch Telegram Bot alert: {e}")

    # 3. Trigger Email Notification
    try:
        # Since send_email_async already does its own driver lookup for safety,
        # we trigger it directly to handle email generation and attachment logic.
        await send_email_async(vtype, plate, fine, img_path)
    except Exception as e:
        log.error(f"Failed to dispatch Email alert: {e}")
