# 🚀 Deployment Guide
## Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB
- Tesseract OCR
## Backend Setup
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Configure .env file
# Edit with your actual credentials
python main.py
```
## Frontend Setup
```powershell
cd frontend
npm install
npm start
```
## Environment Configuration
### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password
3. Add to backend\.env
### Stripe Setup
1. Create account at stripe.com
2. Get test API keys
3. Add to backend\.env and frontend\src\pages\PaymentPage.js
### MongoDB
Ensure MongoDB is running on localhost:27017
## Testing
1. Register a driver
2. Upload a test video
3. Create a violation
4. Process a payment
## Troubleshooting
See full DEPLOYMENT_GUIDE.md artifact from Claude for detailed troubleshooting.
