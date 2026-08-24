import os
import logging
import httpx
from pathlib import Path
from backend.config.settings import settings

log = logging.getLogger("backend.telegram")

# Extract Telegram Bot credentials
BOT_TOKEN = os.getenv("BOT_TOKEN") or os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID") or os.getenv("TELEGRAM_CHAT_ID")

async def send_telegram_alert(
    plate: str, 
    vtype: str, 
    fine: int, 
    time_str: str, 
    payment_link: str, 
    photo_path: str = None
) -> bool:
    """
    Sends an automated notification to a configured Telegram channel or chat.
    Attaches the violation evidence image if available, falling back to a text alert on error.
    """
    if not BOT_TOKEN or not CHAT_ID:
        log.warning("Telegram Bot Token or Chat ID not configured. Skipping Telegram notification.")
        return False

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/"
    caption = (
        f"🚨 *TRAFFIC VIOLATION DETECTED* 🚨\n\n"
        f"🚗 *Vehicle Number:* {plate}\n"
        f"⚠️ *Violation Type:* {vtype.replace('_', ' ').title()}\n"
        f"💵 *Challan Fine:* ₹{fine}\n"
        f"📅 *Timestamp:* {time_str}\n"
        f"📍 *Location:* Junction-4 (Live AI Camera)\n\n"
        f"🔗 *Pay Challan:* [Click Here to Pay Online]({payment_link})"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Check if photo exists and send
            if photo_path and os.path.exists(photo_path):
                try:
                    with open(photo_path, "rb") as photo:
                        files = {"photo": photo}
                        data = {
                            "chat_id": CHAT_ID,
                            "caption": caption,
                            "parse_mode": "Markdown"
                        }
                        res = await client.post(url + "sendPhoto", data=data, files=files)
                        if res.status_code == 200:
                            log.info(f"📧 Telegram photo alert successfully sent for plate: {plate}")
                            return True
                        else:
                            log.warning(f"Telegram sendPhoto returned {res.status_code}. Falling back to text message...")
                except Exception as e:
                    log.error(f"Error opening/reading image file for Telegram: {e}")

            # Text-only message fallback
            data = {
                "chat_id": CHAT_ID,
                "text": caption,
                "parse_mode": "Markdown",
                "disable_web_page_preview": False
            }
            res = await client.post(url + "sendMessage", json=data)
            if res.status_code == 200:
                log.info(f"📧 Telegram text alert successfully sent for plate: {plate}")
                return True
            else:
                log.error(f"Telegram sendMessage failed (status={res.status_code}): {res.text}")
                return False
    except Exception as e:
        log.error(f"Network error sending Telegram notification: {e}")
        return False
