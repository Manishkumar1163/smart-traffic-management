import cv2
import numpy as np
import easyocr
import pytesseract
from pathlib import Path
from backend.config.settings import settings
import logging

log = logging.getLogger(__name__)

# Initialize EasyOCR
try:
    reader = easyocr.Reader(['en'], gpu=False)
except Exception as e:
    log.error(f"Failed to initialize EasyOCR: {e}")
    reader = None

# Configure plate crop folder
cropped_folder = settings.SCREENSHOTS_DIR / "cropped_plates"
cropped_folder.mkdir(parents=True, exist_ok=True)

def ocr_plate(frame, x, y, w, h):
    """
    Enhanced License Plate Recognition with Image Processing & Tesseract Fallback.
    Saves the cropped plate image for auditability.
    """
    # Crop with margin
    h_f, w_f = frame.shape[:2]
    x1, y1 = max(0, x - 10), max(0, y - 10)
    x2, y2 = min(w_f, x + w + 10), min(h_f, y + h + 10)
    roi = frame[y1:y2, x1:x2]
    
    if roi.size == 0:
        return None
        
    try:
        # Save cropped license plate
        import uuid
        crop_name = f"plate_{uuid.uuid4().hex[:8]}.jpg"
        crop_path = cropped_folder / crop_name
        cv2.imwrite(str(crop_path), roi)
    except Exception as e:
        log.warning(f"Could not save cropped plate image: {e}")
        
    # --- Image Enhancement ---
    try:
        # 1. Resize to double for better text visibility
        gray = cv2.resize(roi, (0, 0), fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
        # 2. Convert to Grayscale
        gray = cv2.cvtColor(gray, cv2.COLOR_BGR2GRAY)
        # 3. Bilateral Filter for noise removal while preserving edges
        gray = cv2.bilateralFilter(gray, 11, 17, 17)
        # 4. Contrast enhancement using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        # 5. Thresholding (Otsu Binarization)
        thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    except Exception as e:
        log.error(f"Image enhancement failed: {e}")
        thresh = roi

    # Try EasyOCR
    text = None
    if reader:
        try:
            res = reader.readtext(thresh, detail=0)
            text = ''.join(filter(str.isalnum, ' '.join(res))).upper()
            if len(text) >= 4:
                return text[:12]
        except Exception as e:
            log.debug(f"EasyOCR failed: {e}")

    # Fallback to Tesseract
    try:
        config = '--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        t = pytesseract.image_to_string(thresh, config=config).strip().upper()
        clean_text = ''.join(filter(str.isalnum, t))
        if len(clean_text) >= 4:
            return clean_text[:12]
    except Exception as e:
        log.debug(f"Tesseract fallback failed: {e}")

    return text if text else None
