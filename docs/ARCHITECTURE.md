# 🏗️ System Architecture

## High-Level Design
```
┌─────────────┐
│   Frontend  │ (React - Dashboard, Charts, Leaflet Maps)
│  Port 3000  │
└──────┬──────┘
       │ REST API / JSON Streams
       │
┌──────▼──────┐
│   Backend   │ (FastAPI - Port 8000)
└─┬─────────┬─┘
  │         │
  │   ┌─────┴────────────────────────┐
  │   │                              │
┌─▼───┴─────────┐              ┌─────▼───────────────────────┐
│ Database Layer│              │ Business & AI Service Layer │
│               │              │                             │
│ - MongoDB     │              │ - YOLOv8 Object Tracking    │
│   (violations,│              │ - EasyOCR / Tesseract OCR   │
│    drivers,   │              │ - Custom YOLOv8 Training    │
│    videos,    │              │ - Double Exponential Forecast│
│    stats)     │              │ - ONNX Edge Compilation     │
│               │              │ - Telegram Alert Dispatcher │
└───────────────┘              └─────────────────────────────┘
```

## Components

### Backend Layer
- **Video Processor**: Integrates YOLOv8 multi-class tracking for speeding, wrong lane, wrong direction, and illegal parking. Auto-loads custom `best.pt` weights if present, falling back to `yolov8n.pt`.
- **ANPR OCR Engine**: Captures double evidence screenshots and cropped plates.
- **Telegram Bot Notifier**: Connects to the Telegram Bot API to dispatch instant challan details.
- **Time-Series Forecaster**: Runs a Double Exponential Smoothing (Holt's Linear Trend) forecasting model to project traffic volume.
- **ONNX Optimizer**: Exports PyTorch weights into ONNX models for edge boards.

### Frontend Layer
- **Dashboard**: Real-time stats widgets, glowing Leaflet GIS markers, and recent violations ledger.
- **Analytics Charts**: Renders categorical, volume distributions, top violation areas, and 24h actual vs predicted forecasting graphs.

### Data Layer
- **MongoDB Database**: Collections for `drivers`, `violations`, `videos`, `stats`, `detections`.

## Data Flow
1. User streams camera or uploads traffic video.
2. AI detects speeding, wrong direction, lane violations, and helmet/seatbelt safety.
3. OCR captures and extracts plates, saving cropped evidence.
4. System looks up driver details inside MongoDB.
5. Ticket document is inserted into MongoDB.
6. Dispatcher triggers Telegram and Email alerts concurrently.
7. System forecasts traffic volumes, serving API requests.
