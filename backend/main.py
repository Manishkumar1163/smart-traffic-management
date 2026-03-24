# from fastapi import FastAPI, UploadFile, File, HTTPException, Form
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse, FileResponse
# from motor.motor_asyncio import AsyncIOMotorClient
# from pydantic import BaseModel, EmailStr
# from typing import Optional, List
# import cv2
# import numpy as np
# import pytesseract
# import os
# import shutil
# from datetime import datetime
# import smtplib
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# from email.mime.image import MIMEImage
# import stripe
# import asyncio
# from bson import ObjectId
# import base64
# from ultralytics import YOLO
# import easyocr


# import threading   # add this above if not already

# def run_live_camera():
#     cap = cv2.VideoCapture(0)

#     print("🎥 Live camera started...")

#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break

#         results = model(frame, conf=0.5)

#         for r in results:
#             boxes = r.boxes

#             for box in boxes:
#                 x1, y1, x2, y2 = map(int, box.xyxy[0])
#                 cls = int(box.cls[0])
#                 label = model.names[cls]

#                 if label in ['car', 'motorcycle', 'bus', 'truck']:

#                     # Draw bounding box
#                     cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
#                     cv2.putText(frame, label, (x1, y1-10),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)

#                     # Extract license plate
#                     plate = extract_license_plate(frame, x1, y1, x2-x1, y2-y1)

#                     if plate:
#                         print(f"🚗 Plate detected: {plate}")

#                         cv2.putText(frame, f"Plate: {plate}", (x1, y2+20),
#                                     cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,255), 2)

#                         # 💸 SAVE VIOLATION
#                         violation_doc = {
#                             "video_id": "live_camera",
#                             "violation_type": "live_detection",
#                             "license_plate": plate,
#                             "timestamp": datetime.now().isoformat(),
#                             "fine_amount": 500,
#                             "payment_status": "pending",
#                             "location": "Live Camera",
#                             "created_at": datetime.now().isoformat()
#                         }

#                         asyncio.run(db.violations.insert_one(violation_doc))

#         cv2.imshow("🚦 Live Traffic Detection", frame)

#         if cv2.waitKey(1) & 0xFF == 27:
#             break

#     cap.release()
#     cv2.destroyAllWindows()
# # Configure Tesseract path (backup)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# # Initialize EasyOCR reader
# try:
#     reader = easyocr.Reader(['en'], gpu=False)
#     print("✅ EasyOCR loaded successfully")
# except Exception as e:
#     print(f"⚠ EasyOCR failed to load: {e}. Will use Tesseract as fallback.")
#     reader = None

# app = FastAPI()

# @app.get("/")
# async def root():
#     return {
#         "message": "Smart Traffic Management System API",
#         "status": "running",
#         "docs": "http://localhost:8000/docs"
#     }

# # CORS Configuration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # MongoDB Configuration
# MONGO_URL = "mongodb://localhost:27017"
# client = AsyncIOMotorClient(MONGO_URL)
# db = client.traffic_management

# # Stripe Configuration
# stripe.api_key = "your_stripe_secret_key"

# # Email Configuration
# SMTP_SERVER = "smtp.gmail.com"
# SMTP_PORT = 587
# SMTP_EMAIL = "mk9840508@gmail.com"
# SMTP_PASSWORD = "ycdimyduaeudaewh"

# # Directories
# UPLOAD_DIR = "uploads/videos"
# SCREENSHOT_DIR = "uploads/screenshots"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# # Load YOLO models
# try:
#     model = YOLO('yolov8n.pt')
#     print("✅ YOLO model loaded successfully")
# except Exception as e:
#     print(f"❌ Error loading YOLO model: {e}")
#     model = None

# # Violation detection rules
# VIOLATION_RULES = {
#     'no_helmet': {
#         'classes': ['motorcycle', 'person'],
#         'fine_amount': 1000,
#         'description': 'Riding motorcycle without helmet'
#     },
#     'red_light_violation': {
#         'classes': ['car', 'motorcycle', 'bus', 'truck'],
#         'fine_amount': 1000,
#         'description': 'Red light violation'
#     },
#     'wrong_lane': {
#         'classes': ['car', 'motorcycle', 'bus', 'truck'],
#         'fine_amount': 500,
#         'description': 'Wrong lane driving'
#     },
#     'triple_riding': {
#         'classes': ['motorcycle', 'person'],
#         'fine_amount': 1000,
#         'description': 'Triple riding on motorcycle'
#     },
#     'overspeeding': {
#         'classes': ['car', 'motorcycle', 'bus', 'truck'],
#         'fine_amount': 2000,
#         'description': 'Overspeeding'
#     },
#     'no_seatbelt': {
#         'classes': ['car', 'person'],
#         'fine_amount': 1000,
#         'description': 'Not wearing seatbelt'
#     }
# }

# # Pydantic Models
# class Driver(BaseModel):
#     name: str
#     email: EmailStr
#     phone: str
#     license_plate: str
#     address: str

# class Violation(BaseModel):
#     driver_id: str
#     video_id: str
#     violation_type: str
#     timestamp: str
#     location: str
#     fine_amount: float
#     screenshot_path: str
#     license_plate: str

# class Payment(BaseModel):
#     violation_id: str
#     amount: float
#     payment_method: str

# # Helper Functions
# def extract_license_plate(frame, x, y, w, h):
#     """Extract license plate using EasyOCR (better for Indian plates)"""
#     try:
#         # Expand region for better capture
#         margin = 20
#         y_start = max(0, y - margin)
#         y_end = min(frame.shape[0], y + h + margin)
#         x_start = max(0, x - margin)
#         x_end = min(frame.shape[1], x + w + margin)
        
#         roi = frame[y_start:y_end, x_start:x_end]
        
#         if roi.size == 0:
#             return None
        
#         # Try EasyOCR first (better for license plates)
#         if reader:
#             try:
#                 results = reader.readtext(roi)
#                 if results:
#                     # Combine all detected text
#                     text = ' '.join([result[1] for result in results])
#                     cleaned = ''.join(filter(lambda x: x.isalnum(), text))
                    
#                     if len(cleaned) >= 4:
#                         print(f"    📝 EasyOCR detected: {cleaned}")
#                         return cleaned
#             except Exception as e:
#                 print(f"    ⚠ EasyOCR error: {e}")
        
#         # Fallback to Tesseract if EasyOCR fails
#         gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
#         gray_roi = cv2.bilateralFilter(gray_roi, 11, 17, 17)
#         gray_roi = cv2.threshold(gray_roi, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        
#         configs = ['--psm 8', '--psm 7', '--psm 6']
#         best_text = ""
        
#         for config in configs:
#             text = pytesseract.image_to_string(gray_roi, config=config)
#             cleaned = ''.join(filter(lambda x: x.isalnum(), text))
#             if len(cleaned) > len(best_text):
#                 best_text = cleaned
        
#         if len(best_text) >= 4:
#             print(f"    📝 Tesseract detected: {best_text}")
#             return best_text
        
#         return None
        
#     except Exception as e:
#         print(f"    ⚠ OCR Error: {e}")
#         return None

# def detect_helmet(frame, person_box, motorcycle_box):
#     """Detect if person on motorcycle is wearing helmet using color analysis"""
#     try:
#         px1, py1, px2, py2 = person_box
#         mx1, my1, mx2, my2 = motorcycle_box
        
#         # Check if person is reasonably positioned on motorcycle
#         person_center_x = (px1 + px2) // 2
#         person_center_y = (py1 + py2) // 2
        
#         motorcycle_center_x = (mx1 + mx2) // 2
#         motorcycle_center_y = (my1 + my2) // 2
        
#         # Person should be above or on the motorcycle
#         if person_center_y > motorcycle_center_y + 50:
#             return True  # Person not on motorcycle
        
#         # Check horizontal alignment
#         if abs(person_center_x - motorcycle_center_x) > (mx2 - mx1):
#             return True  # Person not aligned with motorcycle
        
#         # Extract head region (top 25% of person bounding box)
#         person_height = py2 - py1
#         head_height = int(person_height * 0.25)
        
#         if head_height < 5:  # Too small to analyze
#             return True
        
#         head_region = frame[py1:py1+head_height, px1:px2]
        
#         if head_region.size == 0:
#             return True
        
#         # Analyze head region colors
#         hsv = cv2.cvtColor(head_region, cv2.COLOR_BGR2HSV)
        
#         # Helmet detection: Look for solid colors (helmets are usually uniform color)
#         # Dark colors (black helmets)
#         lower_dark = np.array([0, 0, 0])
#         upper_dark = np.array([180, 255, 80])
#         dark_mask = cv2.inRange(hsv, lower_dark, upper_dark)
        
#         # Bright colors (white, red, blue helmets)
#         lower_bright = np.array([0, 0, 150])
#         upper_bright = np.array([180, 100, 255])
#         bright_mask = cv2.inRange(hsv, lower_bright, upper_bright)
        
#         # Red helmets
#         lower_red1 = np.array([0, 100, 100])
#         upper_red1 = np.array([10, 255, 255])
#         lower_red2 = np.array([170, 100, 100])
#         upper_red2 = np.array([180, 255, 255])
#         red_mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
#         red_mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        
#         # Combine masks
#         helmet_mask = dark_mask | bright_mask | red_mask1 | red_mask2
        
#         helmet_ratio = np.sum(helmet_mask > 0) / helmet_mask.size
        
#         # If more than 40% of head shows helmet-like colors, assume helmet
#         has_helmet = helmet_ratio > 0.40
        
#         return has_helmet
        
#     except Exception as e:
#         print(f"  ⚠ Helmet detection error: {e}")
#         return True  # Assume helmet on error to avoid false positives

# def detect_red_light_violation(frame, vehicle_box, traffic_light_box=None):
#     """Detect red light violation (simplified - needs proper traffic light detection)"""
#     # This is a placeholder - you would need:
#     # 1. Traffic light detection model
#     # 2. Stop line detection
#     # 3. Check if vehicle crosses stop line when light is red
    
#     # For now, random detection (replace with actual logic)
#     return np.random.random() > 0.95  # 5% chance

# def count_riders(frame, motorcycle_box, person_boxes):
#     """Count number of people on motorcycle"""
#     mx1, my1, mx2, my2 = motorcycle_box
#     motorcycle_center_x = (mx1 + mx2) // 2
#     motorcycle_center_y = (my1 + my2) // 2
#     motorcycle_width = mx2 - mx1
    
#     count = 0
    
#     for person_box in person_boxes:
#         px1, py1, px2, py2 = person_box
#         person_center_x = (px1 + px2) // 2
#         person_center_y = (py1 + py2) // 2
        
#         # Check if person is on motorcycle (better alignment check)
#         horizontal_distance = abs(person_center_x - motorcycle_center_x)
#         vertical_distance = person_center_y - motorcycle_center_y
        
#         # Person should be horizontally aligned and above/on motorcycle
#         if horizontal_distance < motorcycle_width and vertical_distance < 100 and vertical_distance > -50:
#             count += 1
    
#     return count

# async def send_email(to_email: str, subject: str, body: str, screenshot_path: str = None):
#     """Send email notification"""
#     try:
#         msg = MIMEMultipart()
#         msg['From'] = SMTP_EMAIL
#         msg['To'] = to_email
#         msg['Subject'] = subject
        
#         msg.attach(MIMEText(body, 'html'))
        
#         if screenshot_path and os.path.exists(screenshot_path):
#             with open(screenshot_path, 'rb') as f:
#                 img = MIMEImage(f.read())
#                 img.add_header('Content-Disposition', 'attachment', filename=os.path.basename(screenshot_path))
#                 msg.attach(img)
        
#         server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
#         server.starttls()
#         server.login(SMTP_EMAIL, SMTP_PASSWORD)
#         server.send_message(msg)
#         server.quit()
#         return True
#     except Exception as e:
#         print(f"Email error: {e}")
#         return False

# # API Endpoints
# @app.post("/api/drivers/register")
# async def register_driver(driver: Driver):
#     """Register a new driver"""
#     driver_dict = driver.dict()
#     driver_dict['created_at'] = datetime.now().isoformat()
    
#     existing = await db.drivers.find_one({"license_plate": driver.license_plate})
#     if existing:
#         raise HTTPException(status_code=400, detail="License plate already registered")
    
#     result = await db.drivers.insert_one(driver_dict)
#     return {"message": "Driver registered successfully", "driver_id": str(result.inserted_id)}

# @app.get("/api/drivers")
# async def get_all_drivers():
#     """Get all registered drivers"""
#     drivers = []
#     cursor = db.drivers.find()
#     async for driver in cursor:
#         driver['_id'] = str(driver['_id'])
#         drivers.append(driver)
#     return {"drivers": drivers}

# @app.get("/api/drivers/{license_plate}")
# async def get_driver_by_plate(license_plate: str):
#     """Get driver by license plate"""
#     driver = await db.drivers.find_one({"license_plate": license_plate})
#     if not driver:
#         raise HTTPException(status_code=404, detail="Driver not found")
#     driver['_id'] = str(driver['_id'])
#     return driver

# @app.post("/api/videos/upload")
# async def upload_video(file: UploadFile = File(...), location: str = Form(...)):
#     """Upload and process traffic video"""
#     try:
#         video_path = os.path.join(UPLOAD_DIR, file.filename)
#         with open(video_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
        
#         video_doc = {
#             "filename": file.filename,
#             "path": video_path,
#             "location": location,
#             "uploaded_at": datetime.now().isoformat(),
#             "processed": False
#         }
#         result = await db.videos.insert_one(video_doc)
#         video_id = str(result.inserted_id)
        
#         asyncio.create_task(process_video_with_yolo(video_id, video_path, location))
        
#         return {
#             "message": "Video uploaded successfully",
#             "video_id": video_id,
#             "filename": file.filename
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# async def process_video_with_yolo(video_id: str, video_path: str, location: str):
#     """Process video for ACTUAL violation detection using YOLO"""
#     if not model:
#         print("❌ YOLO model not loaded")
#         return
    
#     cap = cv2.VideoCapture(video_path)
#     frame_count = 0
#     detections = []
#     violations_created = []
    
#     print(f"🎬 Processing video: {video_id}")
    
#     while cap.isOpened():
#         ret, frame = cap.read()
#         if not ret:
#             break
        
#         frame_count += 1
        
#         # Process every 15th frame (balance between speed and accuracy)
#         if frame_count % 15 == 0:
#             print(f"📸 Processing frame {frame_count}")
            
#             results = model(frame, conf=0.5)  # Higher confidence for production
#             boxes = results[0].boxes
            
#             print(f"  📊 Detected {len(boxes)} objects")
            
#             # Organize detections
#             vehicles = []
#             persons = []
#             motorcycles = []
            
#             for box in boxes:
#                 x1, y1, x2, y2 = map(int, box.xyxy[0])
#                 conf = float(box.conf[0])
#                 cls = int(box.cls[0])
#                 class_name = model.names[cls]
                
#                 if class_name in ['car', 'truck', 'bus']:
#                     vehicles.append({'box': (x1, y1, x2, y2), 'conf': conf, 'class': class_name})
#                 elif class_name == 'motorcycle':
#                     motorcycles.append({'box': (x1, y1, x2, y2), 'conf': conf})
#                 elif class_name == 'person':
#                     persons.append({'box': (x1, y1, x2, y2), 'conf': conf})
            
#             print(f"  🏍 Motorcycles: {len(motorcycles)}, 👤 Persons: {len(persons)}, 🚗 Vehicles: {len(vehicles)}")
            
#             # 1. ACTUAL No Helmet Detection
#             for motorcycle in motorcycles:
#                 mx1, my1, mx2, my2 = motorcycle['box']
                
#                 # Find persons on this motorcycle
#                 riders = []
#                 for person in persons:
#                     px1, py1, px2, py2 = person['box']
#                     person_center_x = (px1 + px2) // 2
#                     person_center_y = (py1 + py2) // 2
#                     motorcycle_center_x = (mx1 + mx2) // 2
#                     motorcycle_center_y = (my1 + my2) // 2
                    
#                     # Better overlap detection
#                     if (abs(person_center_x - motorcycle_center_x) < (mx2 - mx1) * 0.8 and
#                         person_center_y < motorcycle_center_y + 50 and
#                         person_center_y > my1 - 50):
#                         riders.append(person)
                
#                 # Check each rider for helmet
#                 for rider in riders:
#                     has_helmet = detect_helmet(frame, rider['box'], motorcycle['box'])
                    
#                     if not has_helmet:
#                         print(f"  🚨 NO HELMET detected!")
                        
#                         # Extract license plate
#                         license_plate = extract_license_plate(frame, mx1, my1, mx2-mx1, my2-my1)
                        
#                         if not license_plate or len(license_plate) < 4:
#                             license_plate = f"UNKNOWN_{frame_count}"
#                             print(f"  ⚠ Could not read plate, using: {license_plate}")
#                         else:
#                             print(f"  ✅ License plate detected: {license_plate}")
                        
#                         # Save screenshot with annotations
#                         timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
#                         screenshot_name = f"{video_id}_{timestamp}_no_helmet.jpg"
#                         screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_name)
                        
#                         frame_annotated = frame.copy()
#                         px1, py1, px2, py2 = rider['box']
#                         cv2.rectangle(frame_annotated, (mx1, my1), (mx2, my2), (0, 0, 255), 3)
#                         cv2.rectangle(frame_annotated, (px1, py1), (px2, py2), (255, 0, 0), 2)
#                         cv2.putText(frame_annotated, f"NO HELMET - {license_plate}", 
#                                   (mx1, my1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
#                         cv2.imwrite(screenshot_path, frame_annotated)
                        
#                         detection_data = {
#                             "video_id": video_id,
#                             "license_plate": license_plate,
#                             "violation_type": "no_helmet",
#                             "timestamp": datetime.now().isoformat(),
#                             "screenshot_path": screenshot_path,
#                             "confidence_score": float(motorcycle['conf']),
#                             "frame_number": frame_count,
#                             "location": location,
#                             "fine_amount": VIOLATION_RULES['no_helmet']['fine_amount']
#                         }
                        
#                         detections.append(detection_data)
            
#             # 2. Triple Riding Detection
#             for motorcycle in motorcycles:
#                 mx1, my1, mx2, my2 = motorcycle['box']
#                 rider_count = count_riders(frame, motorcycle['box'], [p['box'] for p in persons])
                
#                 if rider_count > 2:
#                     print(f"  🚨 TRIPLE RIDING detected! ({rider_count} riders)")
                    
#                     license_plate = extract_license_plate(frame, mx1, my1, mx2-mx1, my2-my1)
                    
#                     if not license_plate or len(license_plate) < 4:
#                         license_plate = f"UNKNOWN_{frame_count}_triple"
#                         print(f"  ⚠ Could not read plate, using: {license_plate}")
#                     else:
#                         print(f"  ✅ License plate detected: {license_plate}")
                    
#                     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
#                     screenshot_name = f"{video_id}_{timestamp}_triple_riding.jpg"
#                     screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_name)
                    
#                     frame_annotated = frame.copy()
#                     cv2.rectangle(frame_annotated, (mx1, my1), (mx2, my2), (0, 0, 255), 3)
#                     cv2.putText(frame_annotated, f"TRIPLE RIDING - {license_plate}", 
#                               (mx1, my1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
#                     cv2.imwrite(screenshot_path, frame_annotated)
                    
#                     detection_data = {
#                         "video_id": video_id,
#                         "license_plate": license_plate,
#                         "violation_type": "triple_riding",
#                         "timestamp": datetime.now().isoformat(),
#                         "screenshot_path": screenshot_path,
#                         "confidence_score": float(motorcycle['conf']),
#                         "frame_number": frame_count,
#                         "location": location,
#                         "fine_amount": VIOLATION_RULES['triple_riding']['fine_amount']
#                     }
                    
#                     detections.append(detection_data)
            
#             # 3. Red Light Violation (if detected)
#             for vehicle in vehicles:
#                 vx1, vy1, vx2, vy2 = vehicle['box']
                
#                 if detect_red_light_violation(frame, vehicle['box']):
#                     print(f"  🚨 RED LIGHT violation detected!")
                    
#                     license_plate = extract_license_plate(frame, vx1, vy1, vx2-vx1, vy2-vy1)
                    
#                     if not license_plate or len(license_plate) < 4:
#                         license_plate = f"UNKNOWN_{frame_count}_redlight"
#                     else:
#                         print(f"  ✅ License plate detected: {license_plate}")
                    
#                     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
#                     screenshot_name = f"{video_id}_{timestamp}_red_light.jpg"
#                     screenshot_path = os.path.join(SCREENSHOT_DIR, screenshot_name)
                    
#                     frame_annotated = frame.copy()
#                     cv2.rectangle(frame_annotated, (vx1, vy1), (vx2, vy2), (0, 0, 255), 3)
#                     cv2.putText(frame_annotated, f"RED LIGHT - {license_plate}", 
#                               (vx1, vy1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
#                     cv2.imwrite(screenshot_path, frame_annotated)
                    
#                     detection_data = {
#                         "video_id": video_id,
#                         "license_plate": license_plate,
#                         "violation_type": "red_light_violation",
#                         "timestamp": datetime.now().isoformat(),
#                         "screenshot_path": screenshot_path,
#                         "confidence_score": float(vehicle['conf']),
#                         "frame_number": frame_count,
#                         "location": location,
#                         "fine_amount": VIOLATION_RULES['red_light_violation']['fine_amount']
#                     }
                    
#                     detections.append(detection_data)
    
#     cap.release()
    
#     print(f"✅ Processing complete. Found {len(detections)} violations")
    
#                 # Save detections and create violations
#     if detections:
#         await db.detections.insert_many(detections)
        
#         for detection in detections:
#             driver = await db.drivers.find_one({"license_plate": detection['license_plate']})
            
#             # CREATE VIOLATION REGARDLESS OF DRIVER STATUS
#             violation_doc = {
#                 "video_id": video_id,
#                 "violation_type": detection['violation_type'],
#                 "license_plate": detection['license_plate'],
#                 "timestamp": detection['timestamp'],
#                 "screenshot_path": detection['screenshot_path'],
#                 "fine_amount": detection['fine_amount'],
#                 "payment_status": "pending",
#                 "confidence_score": detection['confidence_score'],
#                 "location": location,
#                 "created_at": datetime.now().isoformat()
#             }
            
#             if driver:
#                 # If driver found, add driver info
#                 violation_doc["driver_id"] = str(driver['_id'])
#                 violation_doc["driver_name"] = driver['name']
#                 violation_doc["driver_email"] = driver['email']
#                 violation_doc["driver_phone"] = driver['phone']
                
#                 result = await db.violations.insert_one(violation_doc)
#                 violations_created.append(str(result.inserted_id))
                
#                 # Send email
#                 email_body = f"""
#                 <html>
#                 <body>
#                     <h2>🚨 Traffic Violation Notice</h2>
#                     <p>Dear {driver['name']},</p>
#                     <p>A traffic violation has been recorded:</p>
#                     <ul>
#                         <li><strong>License Plate:</strong> {detection['license_plate']}</li>
#                         <li><strong>Violation Type:</strong> {VIOLATION_RULES[detection['violation_type']]['description']}</li>
#                         <li><strong>Location:</strong> {location}</li>
#                         <li><strong>Date/Time:</strong> {detection['timestamp']}</li>
#                         <li><strong>Fine Amount:</strong> ₹{detection['fine_amount']}</li>
#                     </ul>
#                     <p>Please pay the fine within 30 days to avoid additional penalties.</p>
#                     <p>Evidence photo is attached.</p>
#                 </body>
#                 </html>
#                 """
                
#                 await send_email(
#                     driver['email'],
#                     f"Traffic Violation Notice - {detection['violation_type']}",
#                     email_body,
#                     detection['screenshot_path']
#                 )
                
#                 print(f"  📧 Email sent to {driver['email']}")
#             else:
#                 # No driver found - still save violation as "unregistered"
#                 violation_doc["driver_id"] = None
#                 violation_doc["driver_name"] = "Unregistered Vehicle"
#                 violation_doc["driver_email"] = None
#                 violation_doc["driver_phone"] = None
                
#                 result = await db.violations.insert_one(violation_doc)
#                 violations_created.append(str(result.inserted_id))
                
#                 print(f"  ⚠ Violation saved for unregistered plate: {detection['license_plate']}")
    
#     await db.videos.update_one(
#         {"_id": ObjectId(video_id)},
#         {"$set": {
#             "processed": True, 
#             "total_detections": len(detections),
#             "total_violations": len(violations_created)
#         }}
#     )

# @app.get("/api/videos")
# async def get_all_videos():
#     """Get all uploaded videos"""
#     videos = []
#     cursor = db.videos.find()
#     async for video in cursor:
#         video['_id'] = str(video['_id'])
#         videos.append(video)
#     return {"videos": videos}

# @app.get("/api/videos/{video_id}/detections")
# async def get_video_detections(video_id: str):
#     """Get all detections for a video"""
#     detections = []
#     cursor = db.detections.find({"video_id": video_id})
#     async for detection in cursor:
#         detection['_id'] = str(detection['_id'])
#         detections.append(detection)
#     return detections

# @app.post("/api/violations/create")
# async def create_violation(
#     video_id: str = Form(...),
#     license_plate: str = Form(...),
#     violation_type: str = Form(...),
#     timestamp: str = Form(...),
#     location: str = Form(...),
#     confidence_score: float = Form(...)
# ):
#     """Create a violation manually"""
#     driver = await db.drivers.find_one({"license_plate": license_plate})
#     if not driver:
#         raise HTTPException(status_code=404, detail="Driver not found for this license plate")
    
#     fine_amount = VIOLATION_RULES.get(violation_type, {}).get('fine_amount', 500)
    
#     violation_doc = {
#         "driver_id": str(driver['_id']),
#         "video_id": video_id,
#         "violation_type": violation_type,
#         "license_plate": license_plate,
#         "timestamp": timestamp,
#         "fine_amount": fine_amount,
#         "payment_status": "pending",
#         "confidence_score": confidence_score,
#         "location": location,
#         "created_at": datetime.now().isoformat()
#     }
    
#     result = await db.violations.insert_one(violation_doc)
#     return {
#         "message": "Violation created successfully",
#         "violation_id": str(result.inserted_id)
#     }

# @app.get("/api/violations")
# async def get_all_violations():
#     """Get all violations including unregistered vehicles"""
#     violations = []
#     cursor = db.violations.find()
#     async for violation in cursor:
#         violation['_id'] = str(violation['_id'])
        
#         # Check if driver info is already in violation document (for unregistered)
#         if 'driver_name' not in violation and violation.get('driver_id'):
#             # Fetch driver details
#             driver = await db.drivers.find_one({"_id": ObjectId(violation['driver_id'])})
#             if driver:
#                 violation['driver_name'] = driver['name']
#                 violation['driver_email'] = driver['email']
        
#         violations.append(violation)
#     return {"violations": violations}
# @app.get("/api/live/start")
# def start_live_camera():
#     threading.Thread(target=run_live_camera).start()
#     return {"message": "Live camera started successfully"}

# @app.get("/api/violations/driver/{license_plate}")
# async def get_driver_violations(license_plate: str):
#     """Get violations for a specific driver"""
#     violations = []
#     cursor = db.violations.find({"license_plate": license_plate})
#     async for violation in cursor:
#         violation['_id'] = str(violation['_id'])
#         violations.append(violation)
#     return {"violations": violations}

# @app.post("/api/payments/create-intent")
# async def create_payment_intent(violation_id: str = Form(...)):
#     """Create Stripe payment intent"""
#     violation = await db.violations.find_one({"_id": ObjectId(violation_id)})
#     if not violation:
#         raise HTTPException(status_code=404, detail="Violation not found")
    
#     if violation['payment_status'] == 'paid':
#         raise HTTPException(status_code=400, detail="Violation already paid")
    
#     try:
#         intent = stripe.PaymentIntent.create(
#             amount=int(violation['fine_amount'] * 100),
#             currency='inr',
#             metadata={'violation_id': violation_id}
#         )
        
#         return {
#             "client_secret": intent.client_secret,
#             "amount": violation['fine_amount']
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/api/payments/confirm")
# async def confirm_payment(violation_id: str = Form(...), payment_intent_id: str = Form(...)):
#     """Confirm payment"""
#     await db.violations.update_one(
#         {"_id": ObjectId(violation_id)},
#         {
#             "$set": {
#                 "payment_status": "paid",
#                 "payment_date": datetime.now().isoformat(),
#                 "payment_intent_id": payment_intent_id
#             }
#         }
#     )
    
    
#     violation = await db.violations.find_one({"_id": ObjectId(violation_id)})
#     driver = await db.drivers.find_one({"_id": ObjectId(violation['driver_id'])})
    
#     email_body = f"""
#     <html>
#     <body>
#         <h2>✅ Payment Confirmation</h2>
#         <p>Dear {driver['name']},</p>
#         <p>Your payment has been successfully processed.</p>
#         <ul>
#             <li><strong>Violation ID:</strong> {violation_id}</li>
#             <li><strong>Amount Paid:</strong> ₹{violation['fine_amount']}</li>
#             <li><strong>Payment Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</li>
#         </ul>
#         <p>Thank you for your prompt payment.</p>
#     </body>
#     </html>
#     """
    
#     await send_email(driver['email'], "Payment Confirmation", email_body)
    
#     return {"message": "Payment confirmed"}

# @app.get("/api/statistics")
# async def get_statistics():
#     """Get dashboard statistics"""
#     total_drivers = await db.drivers.count_documents({})
#     total_videos = await db.videos.count_documents({})
#     total_violations = await db.violations.count_documents({})
#     pending_payments = await db.violations.count_documents({"payment_status": "pending"})
#     paid_violations = await db.violations.count_documents({"payment_status": "paid"})
    
#     pipeline = [
#         {"$match": {"payment_status": "paid"}},
#         {"$group": {"_id": None, "total": {"$sum": "$fine_amount"}}}
#     ]
#     revenue_result = await db.violations.aggregate(pipeline).to_list(1)
#     total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
#     # Violation type breakdown
#     violation_types = {}
#     cursor = db.violations.find()
#     async for violation in cursor:
#         vtype = violation.get('violation_type', 'unknown')
#         violation_types[vtype] = violation_types.get(vtype, 0) + 1
    
#     return {
#         "total_drivers": total_drivers,
#         "total_videos": total_videos,
#         "total_violations": total_violations,
#         "pending_payments": pending_payments,
#         "paid_violations": paid_violations,
#         "total_revenue": total_revenue,
#         "violation_breakdown": violation_types
#     }

# @app.get("/api/screenshots/{filename}")
# async def get_screenshot(filename: str):
#     """Serve screenshot file"""
#     file_path = os.path.join(SCREENSHOT_DIR, filename)
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="Screenshot not found")
#     return FileResponse(file_path)

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from ultralytics import YOLO
from collections import defaultdict
from datetime import datetime
import cv2, asyncio, threading
import easyocr
import numpy as np

# ================= INIT =================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.traffic_ai

# ================= MODELS =================
vehicle_model = YOLO("yolov8n.pt")

try:
    helmet_model = YOLO("helmet.pt")
    print("✅ Helmet model loaded")
except:
    helmet_model = None
    print("⚠ Helmet model not found")

reader = easyocr.Reader(['en'], gpu=False)

# ================= CONFIG =================
STOP_LINE_Y = 300
TRAFFIC_LIGHT_REGION = (50, 50, 150, 200)

track_history = defaultdict(list)
tracked_objects = {}
vehicle_id_counter = 0
last_violations = {}

# ================= HELPERS =================
def get_vehicle_id(x1,y1,x2,y2):
    global vehicle_id_counter
    cx,cy=(x1+x2)//2,(y1+y2)//2

    for vid,(px,py) in tracked_objects.items():
        if abs(cx-px)<50 and abs(cy-py)<50:
            tracked_objects[vid]=(cx,cy)
            return vid

    vehicle_id_counter+=1
    tracked_objects[vehicle_id_counter]=(cx,cy)
    return vehicle_id_counter


def extract_plate(frame, x, y, w, h):
    roi = frame[y:y+h, x:x+w]
    if roi.size == 0:
        return None

    results = reader.readtext(roi)
    if results:
        text = ''.join(filter(str.isalnum, results[0][1]))
        return text if len(text) >= 4 else None
    return None


def is_red_light(frame):
    x1,y1,x2,y2 = TRAFFIC_LIGHT_REGION
    roi = frame[y1:y2, x1:x2]

    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)

    lower1 = np.array([0,120,70])
    upper1 = np.array([10,255,255])
    lower2 = np.array([170,120,70])
    upper2 = np.array([180,255,255])

    mask1 = cv2.inRange(hsv, lower1, upper1)
    mask2 = cv2.inRange(hsv, lower2, upper2)

    return cv2.countNonZero(mask1+mask2) > 50


def crossed_line(prev_y, curr_y):
    return prev_y < STOP_LINE_Y and curr_y >= STOP_LINE_Y


def estimate_speed(track):
    if len(track) < 2:
        return 0
    (x1,y1),(x2,y2) = track[-2], track[-1]
    return ((x2-x1)**2 + (y2-y1)**2)**0.5 * 0.5


def count_riders(moto, persons):
    mx1,my1,mx2,my2 = moto
    count = 0

    for p in persons:
        px1,py1,px2,py2 = p
        if abs((px1+px2)//2 - (mx1+mx2)//2) < (mx2-mx1):
            count += 1

    return count


def detect_helmet(frame, person_box):
    if not helmet_model:
        return True

    px1,py1,px2,py2 = person_box
    roi = frame[py1:py2, px1:px2]

    results = helmet_model(roi, conf=0.5)

    for r in results:
        for box in r.boxes:
            label = helmet_model.names[int(box.cls[0])]
            if label == "helmet":
                return True

    return False


def save_violation(vtype, plate, fine):
    if not plate:
        return

    key = f"{plate}_{vtype}"

    if key in last_violations:
        if (datetime.now() - last_violations[key]).seconds < 5:
            return

    last_violations[key] = datetime.now()

    asyncio.get_event_loop().create_task(
        db.violations.insert_one({
            "plate": plate,
            "type": vtype,
            "fine": fine,
            "time": datetime.now().isoformat(),
            "status": "pending"
        })
    )

# ================= LIVE CAMERA =================
def run_camera():
    cap = cv2.VideoCapture(0)

    print("🚀 Smart Traffic AI Running")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = vehicle_model(frame, conf=0.5)
        boxes = results[0].boxes

        vehicles = []
        motorcycles = []
        persons = []

        for b in boxes:
            x1,y1,x2,y2 = map(int,b.xyxy[0])
            label = vehicle_model.names[int(b.cls[0])]

            if label in ["car","truck","bus"]:
                vehicles.append((x1,y1,x2,y2))
            elif label == "motorcycle":
                motorcycles.append((x1,y1,x2,y2))
            elif label == "person":
                persons.append((x1,y1,x2,y2))

        red = is_red_light(frame)

        # 🚗 VEHICLES
        for v in vehicles:
            vid = get_vehicle_id(*v)
            cx = (v[0]+v[2])//2
            cy = (v[1]+v[3])//2

            track_history[vid].append((cx,cy))

            if len(track_history[vid]) > 2:
                prev_y = track_history[vid][-2][1]

                if red and crossed_line(prev_y, cy):
                    plate = extract_plate(frame, v[0],v[1],v[2]-v[0],v[3]-v[1])
                    save_violation("red_light", plate, 1000)

            speed = estimate_speed(track_history[vid])
            if speed > 50:
                plate = extract_plate(frame, v[0],v[1],v[2]-v[0],v[3]-v[1])
                save_violation("overspeed", plate, 2000)

        # 🏍 MOTORCYCLE
        for m in motorcycles:
            plate = extract_plate(frame, m[0],m[1],m[2]-m[0],m[3]-m[1])

            if count_riders(m, persons) > 2:
                save_violation("triple_riding", plate, 1000)

            for p in persons:
                if abs((p[0]+p[2])//2 - (m[0]+m[2])//2) < (m[2]-m[0]):
                    if not detect_helmet(frame, p):
                        save_violation("no_helmet", plate, 1000)

        # Draw stop line
        cv2.line(frame, (0, STOP_LINE_Y), (1200, STOP_LINE_Y), (0,0,255), 2)

        cv2.imshow("🚦 Traffic AI", frame)

        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()

# ================= STREAM =================
def generate_frames():
    cap = cv2.VideoCapture(0)

    while True:
        success, frame = cap.read()
        if not success:
            break

        _, buffer = cv2.imencode('.jpg', frame)

        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.get("/stream")
def stream():
    return StreamingResponse(generate_frames(),
        media_type='multipart/x-mixed-replace; boundary=frame')

# ================= API =================
@app.get("/start")
def start():
    threading.Thread(target=run_camera).start()
    return {"msg": "Live detection started"}

@app.get("/violations")
async def get_violations():
    data = []
    async for v in db.violations.find():
        v["_id"] = str(v["_id"])
        data.append(v)
    return data

@app.get("/")
def root():
    return {"status": "running"}

@app.get("/api/statistics")
async def get_statistics():
    total_violations = await db.violations.count_documents({})
    paid_violations = await db.violations.count_documents({"status": "paid"})
    pending_payments = await db.violations.count_documents({"status": "pending"})

    total_revenue = 0
    async for v in db.violations.find({"status": "paid"}):
        total_revenue += v.get("fine", 0)

    return {
        "total_drivers": 0,   # optional (you can add later)
        "total_videos": 0,
        "total_violations": total_violations,
        "pending_payments": pending_payments,
        "paid_violations": paid_violations,
        "total_revenue": total_revenue
    }
    
@app.get("/api/drivers")
async def get_drivers():
    return []

@app.get("/api/videos")
async def get_videos():
    return []

@app.get("/api/violations")
async def get_violations_api():
    data = []
    async for v in db.violations.find():
        v["_id"] = str(v["_id"])
        data.append(v)
    return data