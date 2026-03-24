# 📚 API Documentation
Base URL: \http://localhost:8000\
## Drivers API
### Register Driver
\\\
POST /api/drivers/register
Content-Type: application/json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "license_plate": "string",
  "address": "string"
}
\\\
### Get All Drivers
\\\
GET /api/drivers
\\\
### Get Driver by License Plate
\\\
GET /api/drivers/{license_plate}
\\\
## Videos API
### Upload Video
\\\
POST /api/videos/upload
Content-Type: multipart/form-data
file: video file
location: string
\\\
### Get All Videos
\\\
GET /api/videos
\\\
### Get Video Detections
\\\
GET /api/videos/{video_id}/detections
\\\
## Violations API
### Create Violation
\\\
POST /api/violations/create
Content-Type: multipart/form-data
detection_id: string
violation_type: string
fine_amount: number
\\\
### Get All Violations
\\\
GET /api/violations
\\\
### Get Driver Violations
\\\
GET /api/violations/driver/{license_plate}
\\\
## Payments API
### Create Payment Intent
\\\
POST /api/payments/create-intent
Content-Type: multipart/form-data
violation_id: string
\\\
### Confirm Payment
\\\
POST /api/payments/confirm
Content-Type: multipart/form-data
violation_id: string
payment_intent_id: string
\\\
## Statistics API
### Get Dashboard Statistics
\\\
GET /api/statistics
Response:
{
  "total_drivers": number,
  "total_videos": number,
  "total_violations": number,
  "pending_payments": number,
  "paid_violations": number,
  "total_revenue": number
}
\\\
## Error Responses
All endpoints return standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error
