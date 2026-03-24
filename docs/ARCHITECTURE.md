# 🏗️ System Architecture
## High-Level Design
```
┌─────────────┐
│   Frontend  │ (React)
│  Port 3000  │
└──────┬──────┘
       │ REST API
       │
┌──────▼──────┐
│   Backend   │ (FastAPI)
│  Port 8000  │
└──────┬──────┘
       │
  ┌────┴────┐
  │         │
┌─▼──┐  ┌──▼───┐
│ DB │  │ APIs │
│    │  │      │
└────┘  └──────┘
```
## Components
### Backend Layer
- Video Processor
- OCR Engine
- Violation Manager
- Payment Handler
- Email Service
### Frontend Layer
- Dashboard
- Video Upload
- Violations Management
- Driver Management
- Payment Interface
### Data Layer
- MongoDB Collections:
  - drivers
  - videos
  - detections
  - violations
## Data Flow
1. User uploads video
2. Backend processes video (OpenCV)
3. Detects vehicles and extracts plates (OCR)
4. Creates violation records
5. Sends email notifications
6. Processes payments
## API Endpoints
- POST /api/drivers/register
- POST /api/videos/upload
- GET /api/violations
- POST /api/payments/create-intent
See API_DOCUMENTATION.md for complete list.
