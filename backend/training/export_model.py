import logging
import shutil
import sys
from pathlib import Path
from ultralytics import YOLO

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("export_model")

BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_DIR = BASE_DIR / "weights"

def main():
    log.info("⚙️ STARTING YOLOv8 MODEL EXPORT FOR EDGE DEPLOYMENT")
    
    # 1. Locate custom model weights
    pt_path = WEIGHTS_DIR / "best.pt"
    if not pt_path.exists():
        log.warning(f"Custom model weights 'best.pt' not found at {pt_path}. Falling back to default 'yolov8n.pt'.")
        pt_path = BASE_DIR / "yolov8n.pt"
        if not pt_path.exists():
            pt_path = "yolov8n.pt"

    try:
        log.info(f"Loading weights from: {pt_path}...")
        model = YOLO(str(pt_path))
        
        log.info("Converting PyTorch weights to optimized ONNX representation format...")
        # Export format: ONNX (supported natively by OpenVINO, TensorRT, and ONNX Runtime)
        onnx_file_path = model.export(format="onnx", imgsz=640, dynamic=True)
        
        # Define target path inside weights/best.onnx
        target_onnx_path = WEIGHTS_DIR / "best.onnx"
        WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy(onnx_file_path, target_onnx_path)
        
        log.info(f"✅ Export Successful! Optimized model saved to: {target_onnx_path}")
        sys.exit(0)
    except Exception as e:
        log.error(f"❌ Model export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
