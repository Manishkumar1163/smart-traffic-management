# Email Testing Script
import smtplib
from email.mime.text import MIMEText
SMTP_EMAIL = "mk9840508@gmail.com"
SMTP_PASSWORD = "ycdimyduaeudaewh"
msg = MIMEText("Test email from Traffic Management System")
msg['Subject'] = 'Test Email'
msg['From'] = SMTP_EMAIL
msg['To'] = SMTP_EMAIL
try:
    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(SMTP_EMAIL, SMTP_PASSWORD)
    server.send_message(msg)
    server.quit()
    print("✅ Email sent successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
