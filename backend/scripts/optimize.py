import logging
import sys
from pathlib import Path
from ultralytics import YOLO

# Configure basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("edge_optimizer")

def main():
    log.info("⚙️ STARTING EDGE INFENCE OPTIMIZATION")
    
    # Locate model weights
    pt_path = Path(__file__).resolve().parent.parent / "yolov8n.pt"
    if not pt_path.exists():
        log.warning(f"Local weights not found at {pt_path}. Falling back to default download.")
        pt_path = "yolov8n.pt"
        
    try:
        log.info(f"Loading YOLOv8 PyTorch weights from: {pt_path}...")
        model = YOLO(str(pt_path))
        
        log.info("Compiling model graph to ONNX representation...")
        # Export format: ONNX (supported natively by OpenVINO, TensorRT, and ONNX Runtime)
        onnx_file_path = model.export(format="onnx", imgsz=640, dynamic=True)
        
        log.info(f"✅ Optimization Successful! Edge-optimized model saved to: {onnx_file_path}")
        sys.exit(0)
    except Exception as e:
        log.error(f"❌ Optimization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
