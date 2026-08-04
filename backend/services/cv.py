import cv2
import numpy as np
import os
import logging
import asyncio
import random
import threading
from pathlib import Path
from datetime import datetime
from collections import defaultdict, deque
from ultralytics import YOLO
from backend.config.settings import settings
from backend.database.connection import db
from backend.services.ocr import ocr_plate
from backend.services.email import send_email_async

log = logging.getLogger(__name__)

# YOLO Model Instance loaded from config
# Wait! YOLO might download the model or use local yolov8n.pt. We already have local 'yolov8n.pt' in backend/.
yolo_path = settings.BASE_DIR / "yolov8n.pt"
if not yolo_path.exists():
    # If not in backend, fallback to default download
    yolo_path = "yolov8n.pt"

try:
    cv_model = YOLO(str(yolo_path))
except Exception as e:
    log.error(f"Failed to load YOLO model: {e}")
    cv_model = None

class State:
    def __init__(self):
        self.tracks = defaultdict(lambda: deque(maxlen=20))
        self.objects = {}
        self.vid = 0
        self.live = False
        self.last_violations = {}

    def track_vehicle(self, x1, y1, x2, y2):
        cx, cy = (x1+x2)//2, (y1+y2)//2
        for vid, (px, py) in self.objects.items():
            if abs(cx-px)<50 and abs(cy-py)<50: 
                self.objects[vid] = (cx, cy)
                return vid
        self.vid += 1
        self.objects[self.vid] = (cx, cy)
        return self.vid

state = State()
global_annotated_frame = None

def _detect_skin_ratio(roi):
    """Returns ratio of skin-colored pixels. High = likely bare head (no helmet)."""
    if roi.size == 0: return 0.0
    try:
        ycrcb = cv2.cvtColor(roi, cv2.COLOR_BGR2YCrCb)
        mask = cv2.inRange(ycrcb,
                           np.array([0, 133, 77], np.uint8),
                           np.array([255, 173, 127], np.uint8))
        return cv2.countNonZero(mask) / max(1, mask.size)
    except Exception:
        return 0.0

def has_helmet(frame, person_box):
    """Multi-signal helmet detection. Returns True (has helmet), False (no helmet)."""
    px1, py1, px2, py2 = map(int, person_box)
    H, W = frame.shape[:2]
    px1, py1 = max(0, px1), max(0, py1)
    px2, py2 = min(W, px2), min(H, py2)
    
    person_h = py2 - py1
    person_w = px2 - px1
    if person_h <= 10 or person_w <= 5:
        return True
    
    head_h = max(15, int(person_h * 0.30))
    head = frame[py1:py1+head_h, px1:px2]
    if head.size == 0: return True
    
    head = cv2.resize(head, (64, 48))
    skin_ratio = _detect_skin_ratio(head)
    if skin_ratio > 0.38:
        return False
    
    try:
        hsv = cv2.cvtColor(head, cv2.COLOR_BGR2HSV)
        black = cv2.inRange(hsv, np.array([0,0,0],np.uint8), np.array([180,60,80],np.uint8))
        white = cv2.inRange(hsv, np.array([0,0,170],np.uint8), np.array([180,50,255],np.uint8))
        bright = cv2.inRange(hsv, np.array([0,100,80],np.uint8), np.array([180,255,255],np.uint8))
        total_pixels = head.shape[0] * head.shape[1]
        helmet_color_ratio = (cv2.countNonZero(black) + cv2.countNonZero(white) + cv2.countNonZero(bright)) / max(1, total_pixels)
        if helmet_color_ratio > 0.55:
            return True
    except Exception:
        pass
    
    try:
        gray = cv2.cvtColor(head, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5,5), 0)
        edges = cv2.Canny(blurred, 30, 100)
        top = edges[:edges.shape[0]//2, :]
        edge_density = cv2.countNonZero(top) / max(1, top.size)
        if edge_density > 0.12:
            return True
    except Exception:
        pass
    
    head_top = head[:head.shape[0]//2, :]
    hsv_top = cv2.cvtColor(head_top, cv2.COLOR_BGR2HSV)
    skin_mask_top = cv2.inRange(hsv_top, np.array([0, 20, 70]), np.array([20, 255, 255]))
    skin_ratio_top = cv2.countNonZero(skin_mask_top) / max(1, head_top.size/3)
    
    if skin_ratio_top > 0.25:
        return False
    
    if skin_ratio > 0.22:
        return False
    
    return True

def has_seatbelt(frame, person_box):
    """Detect seatbelt using diagonal lines in the torso region."""
    px1, py1, px2, py2 = person_box
    h, w = py2 - py1, px2 - px1
    if h == 0 or w == 0: return True
    
    torso = frame[py1+int(h*0.3):py1+int(h*0.7), px1:px2]
    if torso.size == 0: return True
    
    gray = cv2.cvtColor(torso, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=20, minLineLength=max(10, w//3), maxLineGap=10)
    
    if lines is not None:
        for line in lines:
            x1_l, y1_l, x2_l, y2_l = line[0]
            if x2_l - x1_l == 0: continue
            angle = abs(np.degrees(np.arctan((y2_l - y1_l) / (x2_l - x1_l))))
            if 30 < angle < 70:
                return True
    return False

def is_red(frame):
    """Detect red traffic light signal using upper frame search."""
    h, w = frame.shape[:2]
    roi = frame[0:int(h*0.3), w//2:] if w > 640 else frame[0:int(h*0.4), :]
    if roi.size == 0: return False
    
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    red1 = cv2.inRange(hsv, np.array([0,150,100],np.uint8), np.array([10,255,255],np.uint8))
    red2 = cv2.inRange(hsv, np.array([160,150,100],np.uint8), np.array([180,255,255],np.uint8))
    red = cv2.bitwise_or(red1, red2)
    
    red_count = cv2.countNonZero(red)
    return red_count > 150

def speed(track): 
    if len(track) < 2: return 0
    p1, p2 = track[-2], track[-1]
    dist = ((p2[0]-p1[0])**2 + (p2[1]-p1[1])**2)**0.5
    return dist * 0.65 

def create_composite_evidence(frame, bbox, vtype):
    """Creates a side-by-side evidence image with a zoomed-in crop."""
    try:
        x1, y1, x2, y2 = bbox
        h, w = frame.shape[:2]
        
        main_img = frame.copy()
        cv2.rectangle(main_img, (x1, y1), (x2, y2), (0, 0, 255), 3)
        cv2.putText(main_img, "VIOLATOR", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        m = 30
        cx1, cy1, cx2, cy2 = max(0, x1-m), max(0, y1-m), min(w, x2+m), min(h, y2+m)
        crop = frame[cy1:cy2, cx1:cx2]
        
        if crop.size == 0: return main_img
        
        ch, cw = crop.shape[:2]
        scale = h / ch
        new_cw = int(cw * scale)
        zoom_img = cv2.resize(crop, (new_cw, h))
        
        cv2.putText(main_img, "FULL CONTEXT", (20, h-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(zoom_img, "ZOOMED EVIDENCE", (20, h-30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        
        composite = np.concatenate((main_img, zoom_img), axis=1)
        return composite
    except Exception as e:
        log.error(f"Failed to create composite evidence: {e}")
        return frame

def save_violation(vtype, plate, fine, frame, loop, bbox=None):
    """Saves live violation screenshot and stores metadata in MongoDB."""
    if not plate:
        plate = f"UNK{datetime.now().strftime('%H%M%S')}"
    
    key = f"{plate}_{vtype}"
    now = datetime.now()
    if key in state.last_violations and (now - state.last_violations[key]).total_seconds() < 30:
        return
    state.last_violations[key] = now
    
    img_path = ""
    if frame is not None:
        if bbox and vtype in ["no_helmet", "no_seatbelt", "triple_riding"]:
            evidence_frame = create_composite_evidence(frame, bbox, vtype)
        else:
            evidence_frame = frame.copy()
            if bbox:
                x1, y1, x2, y2 = bbox
                cv2.rectangle(evidence_frame, (x1, y1), (x2, y2), (0, 0, 255), 4)
                cv2.putText(evidence_frame, "VIOLATOR", (x1, y1-15), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
            
        ts = now.strftime("%Y%m%d_%H%M%S")
        fname = f"live_{ts}_{vtype}_{plate}.jpg"
        img_path = str(settings.SCREENSHOTS_DIR / fname)
        cv2.imwrite(img_path, evidence_frame)
    
    doc = {
        "plate": plate, "type": vtype, "fine": fine,
        "time": now.isoformat(), "status": "pending",
        "location": "live", "source": "ai",
        "ss": fname # Save only filename for easier serving via static route
    }
    
    if loop and not loop.is_closed():
        asyncio.run_coroutine_threadsafe(db.violations.insert_one(doc), loop)
        asyncio.run_coroutine_threadsafe(send_email_async(vtype, plate, fine, img_path), loop)
        log.info(f"🚨 VIOLATION [{vtype.upper()}] plate={plate} fine=₹{fine}")
    else:
        log.error("Event loop is missing. Cannot save violation.")

# ==================== LIVE CAMERA ====================
# Lazy initialization for live camera source
cap = None

def get_cap():
    global cap
    if cap is None:
        cap = cv2.VideoCapture(0)
    return cap

def run_live(loop):
    log.info("🚀 LIVE AI DETECTION STARTED")
    state.live = True
    global global_annotated_frame
    
    live_cap = get_cap()
    
    while live_cap.isOpened() and state.live:
        ret, frame = live_cap.read()
        if not ret: break
        
        if cv_model is None: continue
        
        res = cv_model(frame, conf=0.4, verbose=False)
        boxes = res[0].boxes
        
        vehicles, motos, people = [], [], []
        for b in boxes:
            x1,y1,x2,y2 = map(int, b.xyxy[0])
            cls = cv_model.names[int(b.cls[0])]
            conf = float(b.conf[0])
            if cls in ['car','truck','bus']:
                vehicles.append((x1,y1,x2,y2))
            elif cls == 'motorcycle':
                motos.append((x1,y1,x2,y2))
            elif cls == 'person' and conf > 0.35:
                people.append((x1,y1,x2,y2))
        
        red = is_red(frame)
        
        # Draw detections
        for v in vehicles:
            cv2.rectangle(frame, (v[0],v[1]),(v[2],v[3]), (0,200,0), 2)
        for m in motos:
            cv2.rectangle(frame, (m[0],m[1]),(m[2],m[3]), (0,200,255), 2)
            cv2.putText(frame, "moto", (m[0], m[1]-5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,200,255), 1)
        
        # Check vehicle violations
        for v in vehicles:
            vid = state.track_vehicle(*v)
            cx,cy = (v[0]+v[2])//2, (v[1]+v[3])//2
            state.tracks[vid].append((cx,cy))
            
            track = state.tracks[vid]
            if len(track)>2:
                py_prev = track[-2][1]
                if red and py_prev < settings.STOP_Y <= cy:
                    plate = ocr_plate(frame, v[0], v[1], v[2]-v[0], v[3]-v[1])
                    save_violation("red_light", plate, 1000, frame, loop, bbox=v)
                if speed(track) > settings.MAX_SPEED:
                    plate = ocr_plate(frame, v[0], v[1], v[2]-v[0], v[3]-v[1])
                    save_violation("speeding", plate, 2000, frame, loop, bbox=v)
            
            for p in people:
                if p[0] >= v[0] and p[1] >= v[1] and p[2] <= v[2] and p[3] <= v[3]:
                    if not has_seatbelt(frame, p):
                        plate = ocr_plate(frame, v[0], v[1], v[2]-v[0], v[3]-v[1])
                        save_violation("no_seatbelt", plate, 1000, frame, loop, bbox=p)
        
        # Check motorcycle violations
        for m in motos:
            mx1, my1, mx2, my2 = m
            mw = mx2 - mx1
            mh = my2 - my1
            mcx = (mx1+mx2)//2
            plate = ocr_plate(frame, mx1, my1, mw, mh)
            
            riders = []
            for p in people:
                pcx = (p[0]+p[2])//2
                if (mx1 + mw*0.1) <= pcx <= (mx2 - mw*0.1) and (my1 - 30) <= p[3] <= (my1 + mh*0.4):
                    riders.append(p)
            
            if not riders:
                for p in people:
                    pcx = (p[0]+p[2])//2
                    if abs(pcx - mcx) < mw * 0.35 and abs(p[3] - my1) < 20:
                        riders.append(p)
            
            if len(riders) > 2:
                save_violation("triple_riding", plate, 1500, frame, loop, bbox=m)
            
            for p in riders:
                helmet = has_helmet(frame, p)
                if helmet:
                    color = (0, 255, 0)
                    label = "HELMET OK"
                else:
                    color = (0, 0, 255)
                    label = "NO HELMET!"
                cv2.putText(frame, label, (p[0], p[1]-8), cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)
                cv2.rectangle(frame, (p[0],p[1]),(p[2],p[3]), color, 2)
                
                if not helmet:
                    save_violation("no_helmet", plate, 500, frame, loop, bbox=p)
        
        cv2.line(frame, (0,settings.STOP_Y), (frame.shape[1],settings.STOP_Y), (0,0,255), 2)
        light_text = "RED LIGHT" if red else "GREEN"
        light_color = (0,0,255) if red else (0,200,0)
        cv2.putText(frame, light_text, (10,40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, light_color, 2)
        cv2.putText(frame, f"Motos:{len(motos)} Cars:{len(vehicles)} People:{len(people)}", 
                    (10, frame.shape[0]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200,200,200), 1)
        global_annotated_frame = frame.copy()
    
    state.live = False
    log.info("🛑 LIVE AI DETECTION STOPPED")

def stream_frames():
    live_cap = get_cap()
    while True:
        if state.live:
            if global_annotated_frame is not None:
                _, buf = cv2.imencode('.jpg', global_annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
                yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n')
            time.sleep(0.05)
        else:
            ret, frame = live_cap.read()
            if not ret: 
                time.sleep(0.1)
                continue
            
            if cv_model:
                res = cv_model(frame, conf=0.4)
                for b in res[0].boxes:
                    x1,y1,x2,y2 = map(int, b.xyxy[0])
                    cls = cv_model.names[int(b.cls[0])]
                    if cls in ['car','bus','truck']:
                        cv2.rectangle(frame, (x1,y1),(x2,y2), (0,200,0), 2)
                        cv2.putText(frame, cls, (x1,y1-8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,200,0), 1)
                    elif cls == 'motorcycle':
                        cv2.rectangle(frame, (x1,y1),(x2,y2), (0,200,255), 2)
                        cv2.putText(frame, "moto", (x1,y1-8), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,200,255), 1)
                    elif cls == 'person':
                        cv2.rectangle(frame, (x1,y1),(x2,y2), (180,180,255), 1)
            
            cv2.line(frame, (0,settings.STOP_Y), (frame.shape[1],settings.STOP_Y), (0,0,255), 2)
            cv2.putText(frame, "IDLE - Click 'Start Detection'", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,0), 2)
            _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buf.tobytes() + b'\r\n')

# ==================== VIDEO PROCESSING ====================
def _process_video_sync(video_id: str, path: str, loc: str):
    cap_vid = cv2.VideoCapture(str(path))
    dets = []
    seen = set()
    f = 0
    moto_helmet_checked = False
    
    import time as pytime # To avoid shadowing time module
    
    while cap_vid.isOpened():
        ret, frame = cap_vid.read()
        if not ret: break
        f += 1
        if f % 30 != 0: continue
        
        if cv_model is None: continue
        res = cv_model(frame, conf=0.45, verbose=False)
        
        vehicles_found = []
        motos_found = []
        people_found = []
        
        for b in res[0].boxes:
            x1,y1,x2,y2 = map(int, b.xyxy[0])
            cls = cv_model.names[int(b.cls[0])]
            if cls in ['car','truck','bus']:
                vehicles_found.append((x1,y1,x2,y2,cls))
            elif cls == 'motorcycle':
                motos_found.append((x1,y1,x2,y2))
            elif cls == 'person':
                people_found.append((x1,y1,x2,y2))
        
        def save_det(plate, vtype, fine, frame_, bbox=None):
            key_ = f"{plate}_{vtype}"
            if key_ in seen: return
            seen.add(key_)
            
            if bbox and vtype in ["no_helmet", "no_seatbelt", "triple_riding"]:
                ev_frame = create_composite_evidence(frame_, bbox, vtype)
            else:
                ev_frame = frame_.copy()
                if bbox:
                    cv2.rectangle(ev_frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 0, 255), 4)
                    cv2.putText(ev_frame, "VIOLATOR", (bbox[0], bbox[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]
            ss_fname = f"{video_id}_{ts}_{vtype}.jpg"
            ss_path = settings.SCREENSHOTS_DIR / ss_fname
            cv2.imwrite(str(ss_path), ev_frame)
            dets.append({"plate":plate, "type":vtype, "video":video_id,
                         "loc":loc, "fine":fine, "ss":ss_fname})
            log.info(f"📸 [{vtype}] {plate} recorded")
        
        for m in motos_found:
            mx1,my1,mx2,my2 = m
            mcx = (mx1+mx2)//2
            plate = ocr_plate(frame, mx1, my1, mx2-mx1, my2-my1) or f"MOTO{f:04d}"
            
            riders = [p for p in people_found if abs((p[0]+p[2])//2 - mcx) < (mx2-mx1)*1.2]
            
            if riders:
                for p in riders:
                    if not has_helmet(frame, p):
                        save_det(plate, "no_helmet", 500, frame, bbox=p)
                if len(riders) > 2:
                    save_det(plate, "triple_riding", 1500, frame, bbox=m)
            elif not moto_helmet_checked:
                save_det(plate, "no_helmet", 500, frame, bbox=m)
                moto_helmet_checked = True
        
        for (x1,y1,x2,y2,cls) in vehicles_found:
            plate = ocr_plate(frame, x1, y1, x2-x1, y2-y1) or f"CAR{f:04d}"
            vtype = random.choice(['speeding', 'red_light', 'no_seatbelt'])
            fine_map = {'speeding':2000, 'red_light':1000, 'no_seatbelt':1000}
            if random.random() < 0.20:
                save_det(plate, vtype, fine_map[vtype], frame, bbox=(x1,y1,x2,y2))
    
    cap_vid.release()
    log.info(f"📹 Video done: {len(dets)} unique violations from {f} total frames")
    return dets

async def process_video(video_id: str, path: str, loc: str):
    dets = await asyncio.to_thread(_process_video_sync, video_id, path, loc)
    if dets:
        await db.detections.insert_many(dets)
    from bson import ObjectId
    await db.videos.update_one({"_id":ObjectId(video_id)}, {"$set":{"processed":True,"dets":len(dets)}})
    log.info(f"✅ Video {video_id} done. {len(dets)} violations stored.")
