# AI Email Triage & Response System (OpenEnv)

## Overview
This environment simulates a real-world, industry-level problem: **Inbox Overload**. 
An AI Agent acts as an Enterprise Support Agent, reading incoming emails and managing them by correctly triaging (spam/work/personal), prioritizing urgent issues, and drafting professional replies to critical emails. 

## Features
- Complies entirely with the **OpenEnv** spec.
- **FastAPI** web interface allowing the agent to `/reset`, `/step`, and track `/state`.
- Containerized via `Dockerfile` for single-click deployment to **Hugging Face Spaces**.
- Includes `inference.py` using standard `openai` library to point to Hugging Face router and simulate agent run.

## Tasks
1. **Easy**: Classify clear emails (e.g. identify spam vs work vs personal). 
2. **Medium**: Evaluate multi-email urgency, identifying SLA breach alerts from VIP clients and marking them as priority.
3. **Hard**: Professionally respond to difficult scenarios like angry customers demanding refunds and pending supplier invoices. Grader uses deterministic length & keyword checking.

## Usage
1. Setup virtual env: `pip install -r requirements.txt`
2. Start server: `uvicorn api:app --host 0.0.0.0 --port 7860`
3. In another terminal, set variables and run:
   ```bash
   export HF_TOKEN="your_huggingface_token"
   export MODEL_NAME="meta-llama/Meta-Llama-3-70B-Instruct"
   python inference.py
   ```
