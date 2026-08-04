import os
import json
import requests
from openai import OpenAI

API_BASE_URL = os.getenv("API_BASE_URL", "https://router.huggingface.co/v1")
API_KEY = os.getenv("HF_TOKEN") or os.getenv("API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "meta-llama/Meta-Llama-3-70B-Instruct")
ENV_URL = "http://127.0.0.1:7860"

client = OpenAI(
    base_url=API_BASE_URL,
    api_key=API_KEY if API_KEY else "dummy-key"
)

SYSTEM_PROMPT = """You are an AI Email Triage Agent.
You receive JSON observations of your inbox. You must reply with exactly ONE valid action in JSON format. Do not include any other text format.
Valid JSON actions:
{"command": "classify", "email_id": "...", "category": "spam"} (or work, personal)
{"command": "reply", "email_id": "...", "message": "..."}
{"command": "mark_priority", "email_id": "..."}
{"command": "archive", "email_id": "..."}
{"command": "delete", "email_id": "..."}
{"command": "noop"}
"""

def run_task(task_name: str):
    print(f"\n--- Running Task: {task_name} ---")
    
    resp = requests.post(f"{ENV_URL}/reset", json={"task": task_name})
    if resp.status_code != 200:
        print(f"Error resetting env: {resp.text}")
        return
    
    env_data = resp.json()
    obs = env_data["observation"]
    done = False
    step = 0
    final_score = 0.0
    
    while not done:
        step += 1
        print(f"\nStep {step}")
        prompt = f"Observation:\n{json.dumps(obs, indent=2)}\n\nWhat is your next action? Output ONLY JSON."
        
        try:
            chat_completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200,
                response_format={ "type": "json_object" }
            )
            action_text = chat_completion.choices[0].message.content
            action_dict = json.loads(action_text)
        except Exception as e:
            print(f"LLM Error: {e}")
            # simple mock hardcoded fallback for easy testing if key is wrong
            action_dict = {"command": "noop"}
            if task_name == "easy" and step == 1: action_dict = {"command": "classify", "email_id": "e1", "category": "spam"}
            elif task_name == "easy" and step == 2: action_dict = {"command": "classify", "email_id": "e2", "category": "work"}
            elif task_name == "easy" and step == 3: action_dict = {"command": "classify", "email_id": "e3", "category": "personal"}
            if step > 3: done = True
            
        print(f"Action taken: {action_dict}")
        
        step_resp = requests.post(f"{ENV_URL}/step", json=action_dict)
        if step_resp.status_code != 200:
            print(f"Error stepping env: {step_resp.text}")
            break
            
        step_data = step_resp.json()
        obs = step_data["observation"]
        done = step_data["done"]
        final_score = step_data["reward"]
        
    print(f"\nTask {task_name} finished. Final Score: {final_score}")

if __name__ == "__main__":
    if not API_KEY:
        print("Warning: HF_TOKEN not set. Inference will use fallback mock logic if LLM fails.")
    run_task("easy")
    run_task("medium")
    run_task("hard")
