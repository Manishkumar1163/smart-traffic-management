from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from environment import Action
from tasks import get_easy_env, get_medium_env, get_hard_env

app = FastAPI(title="AI Email Triage & Response System")

current_env = None
current_grader = None

class ResetRequest(BaseModel):
    task: str  # "easy", "medium", "hard"

@app.get("/")
def ping():
    return {"status": "ok", "message": "Email Triage Agent Environment is running."}

@app.post("/reset")
def reset(req: ResetRequest):
    global current_env, current_grader
    if req.task == "easy":
         current_env, current_grader = get_easy_env()
    elif req.task == "medium":
         current_env, current_grader = get_medium_env()
    elif req.task == "hard":
         current_env, current_grader = get_hard_env()
    else:
         raise HTTPException(status_code=400, detail="Invalid task. Choose easy, medium, or hard.")
    
    obs = current_env.reset()
    return {"observation": obs.model_dump(), "info": {"task": req.task}}

@app.post("/step")
def step(action: Action):
    global current_env, current_grader
    if not current_env:
         raise HTTPException(status_code=400, detail="Environment not initialized. Call /reset first.")
    
    obs, _, done, info = current_env.step(action)
    score = current_grader.grade(current_env)
    
    return {
        "observation": obs.model_dump(),
        "reward": score,
        "done": done,
        "info": info
    }

@app.get("/state")
def state():
    if not current_env:
         raise HTTPException(status_code=400, detail="Environment not initialized.")
    return current_env.state()
