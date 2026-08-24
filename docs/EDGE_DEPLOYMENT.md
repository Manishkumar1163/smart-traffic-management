# 🧠 YOLOv8 Edge Deployment & Hardware Optimization Guide

This document details the configuration, deployment, and optimization steps required to run the fine-tuned Smart Traffic YOLOv8 model (`best.onnx`) on low-power embedded edge devices (NVIDIA Jetson Nano, Raspberry Pi 4/5) at traffic junctions.

---

## 1. Hardware Optimization Frameworks

For real-time traffic monitoring at the edge, standard PyTorch inference is too slow (typically <5 FPS on CPU). The compiled ONNX model can be optimized for specific hardware accelerators:

```
┌─────────────────────────────────┐
│     Fine-Tuned PyTorch Model    │ (weights/best.pt)
└────────────────┬────────────────┘
                 │
                 ▼ (backend/training/export_model.py)
┌─────────────────────────────────┐
│     Universal ONNX Model File   │ (weights/best.onnx)
└────────┬────────────────────────┘
         │
         ├─────────────────────────────────────┐
         ▼ (TensorRT Optimization)             ▼ (OpenVINO Optimization)
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│ NVIDIA Jetson Edge Nodes        │   │ Intel CPUs & Raspberry Pi       │
│ (e.g., Jetson Nano, Xavier, Orin)│  │ (using Neural Compute Stick 2)  │
│ - Inference Engine: TensorRT    │   │ - Inference Engine: OpenVINO    │
│ - Target FP16 / INT8 Precision   │   │ - Target FP32 / FP16 Precision  │
└─────────────────────────────────┘   └─────────────────────────────────┘
```

---

## 2. Deployment on NVIDIA Jetson Nano

NVIDIA Jetson boards feature CUDA-capable GPUs, allowing high-speed deep learning inference using **NVIDIA TensorRT**.

### 2.1 Optimization with TensorRT
Convert the `best.onnx` model into a highly optimized TensorRT engine file (`best.engine`) by running `trtexec`:

```bash
# Compile to FP16 Precision engine (highly optimized for Jetson GPU cores)
/usr/src/tensorrt/bin/trtexec \
  --onnx=best.onnx \
  --saveEngine=best.engine \
  --fp16 \
  --workspace=2048
```

### 2.2 Inference Code (Python)
Utilize the TensorRT engine inside Python with CUDA bindings:

```python
import tensorrt as trt
import pycuda.driver as cuda
import pycuda.autoinit
import numpy as np

# Load engine and allocate memory
TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
with open("best.engine", "rb") as f, trt.Runtime(TRT_LOGGER) as runtime:
    engine = runtime.deserialize_cuda_engine(f.read())
    context = engine.create_execution_context()

# Allocate buffers, copy to device, execute, and copy back...
```

*Expected Performance: 22–28 FPS at 640x640 resolution (INT8/FP16) on Jetson Nano.*

---

## 3. Deployment on Raspberry Pi (4/5)

Raspberry Pi does not contain a dedicated GPU, so CPU optimizations or external hardware accelerators are used.

### 3.1 Inference Optimization via ONNX Runtime (CPU)
Run inference using `onnxruntime` with CPU execution providers:

```bash
# Install runtime dependencies
pip install onnxruntime
```

Configure the Python session using thread limits:

```python
import onnxruntime as ort

options = ort.SessionOptions()
options.intra_op_num_threads = 4  # Utilize all 4 ARM cores
options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL

session = ort.InferenceSession("best.onnx", options)
input_name = session.get_inputs()[0].name
outputs = session.run(None, {input_name: processed_frame})
```

*Expected Performance: 3–6 FPS on Raspberry Pi 4 CPU.*

### 3.2 Intel Movidius NCS2 Integration (OpenVINO)
To achieve real-time rates (18+ FPS) on a Raspberry Pi, attach an **Intel Movidius Neural Compute Stick 2 (NCS2)**.

Compile the ONNX model into OpenVINO Intermediate Representation (IR):

```bash
# Compile to FP16 IR representation
mo --input_model best.onnx --data_type FP16 --output_dir openvino_ir/
```

Initialize OpenVINO core in python pointing to the `MYRIAD` NCS2 device plug:

```python
from openvino.runtime import Core

core = Core()
model = core.read_model(model="openvino_ir/best.xml")
compiled_model = core.compile_model(model=model, device_name="MYRIAD")
```

---

## 4. Edge vs Centralized Cloud Trade-offs

| Parameter | Edge Processing (Jetson/Pi) | Centralized Cloud (FastAPI Server) |
|---|---|---|
| **Bandwidth Usage** | Low (sends only JSON alerts metadata) | High (sends full 1080p video streams) |
| **Inference Latency**| Real-time (< 30ms response) | Network dependent (100ms - 500ms) |
| **System Reliability**| High (works during internet disconnects) | Low (crashes if central connection drops) |
| **Installation Cost** | High (hardware cost per camera pole) | Low (shared central compute resources) |
