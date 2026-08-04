import smtplib
import os
import asyncio
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime
from backend.config.settings import settings

log = logging.getLogger(__name__)

async def send_email_async(vtype, plate, fine, img_path):
    """Sends violation alert email to driver's email address."""
    def _send():
        sender = settings.SMTP_SENDER
        pwd = settings.SMTP_PASSWORD
        if not pwd or not sender:
            log.warning("Email service not configured. Mocking email send.")
            return
        
        recipient = f"{plate.lower()}@example.com"
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = recipient
        msg['Subject'] = f"Traffic Violation Notice: {vtype.replace('_', ' ').title()} ({plate})"
        
        body = (
            f"Dear Owner of Vehicle {plate},\n\n"
            f"A traffic violation has been detected by our AI Smart Traffic System.\n\n"
            f"Violation Details:\n"
            f"------------------\n"
            f"Type: {vtype.replace('_', ' ').title()}\n"
            f"Fine: Rs. {fine}\n"
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
            f"Please find the evidence image attached.\n\n"
            f"To settle this fine, log in to the Smart Traffic portal.\n\n"
            f"Regards,\n"
            f"Smart Traffic Management System"
        )
        msg.attach(MIMEText(body, 'plain'))
        
        if img_path and os.path.exists(img_path):
            try:
                with open(img_path, 'rb') as f:
                    img_data = f.read()
                image = MIMEImage(img_data, name=os.path.basename(img_path))
                msg.attach(image)
            except Exception as e:
                log.error(f"Failed to attach image to email: {e}")
        
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender, pwd)
            server.send_message(msg)
            server.quit()
            log.info(f"📧 Violation Alert email sent to {recipient}")
        except Exception as e:
            log.error(f"Failed to send email to {recipient}: {e}")

    await asyncio.to_thread(_send)

async def send_settlement_email_async(vtype, plate, fine):
    """Sends payment receipt confirmation email."""
    def _send():
        sender = settings.SMTP_SENDER
        pwd = settings.SMTP_PASSWORD
        if not pwd or not sender:
            log.warning("Email service not configured. Mocking payment receipt email.")
            return
        
        recipient = f"{plate.lower()}@example.com"
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = recipient
        msg['Subject'] = f"Payment Successful: Violation Case {plate}"
        
        body = (
            f"Dear Owner of Vehicle {plate},\n\n"
            f"This is a formal confirmation that the traffic violation penalty has been SETTLED.\n\n"
            f"Violation Details:\n"
            f"------------------\n"
            f"Type: {vtype.replace('_', ' ').title()}\n"
            f"Penalty Amount: Rs. {fine}\n"
            f"Status: PAID & CLOSED\n\n"
            f"Thank you for your cooperation in maintaining road safety.\n\n"
            f"Smart Traffic Management Authority"
        )
        msg.attach(MIMEText(body, 'plain'))
        
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender, pwd)
            server.send_message(msg)
            server.quit()
            log.info(f"🧾 Settlement Receipt sent to {recipient}")
        except Exception as e:
            log.error(f"Failed to send settlement email: {e}")

    await asyncio.to_thread(_send)
