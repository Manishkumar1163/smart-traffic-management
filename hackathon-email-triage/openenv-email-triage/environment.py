from pydantic import BaseModel
from typing import List, Optional, Literal

class Email(BaseModel):
    id: str
    sender: str
    subject: str
    content: str
    urgency: str  # "high", "normal", "low"
    category: Optional[str] = None
    priority_flag: bool = False
    status: str = "unread"  # "unread", "read", "replied", "archived", "deleted"
    reply_text: Optional[str] = None

class Observation(BaseModel):
    emails: List[Email]
    current_time: str
    remaining_steps: int
    feedback: Optional[str] = None

class Action(BaseModel):
    command: Literal["classify", "reply", "mark_priority", "archive", "delete", "noop"]
    email_id: Optional[str] = None
    category: Optional[str] = None
    message: Optional[str] = None

class EmailEnv:
    def __init__(self, emails: List[Email], max_steps: int = 10):
        self.emails_dict = {e.id: e for e in emails}
        self.initial_emails = [e.model_copy() for e in emails]
        self.max_steps = max_steps
        self.steps_taken = 0
        self.current_time = "2026-03-28T09:00:00"
        self.done = False

    def reset(self):
        self.emails_dict = {e.id: e.model_copy() for e in self.initial_emails}
        self.steps_taken = 0
        self.done = False
        return self._get_obs()

    def state(self):
        return {
            "steps_taken": self.steps_taken,
            "max_steps": self.max_steps,
            "done": self.done,
            "emails": [e.model_dump() for e in self.emails_dict.values()]
        }

    def _get_obs(self, feedback: str = None) -> Observation:
        return Observation(
            emails=list(self.emails_dict.values()),
            current_time=self.current_time,
            remaining_steps=self.max_steps - self.steps_taken,
            feedback=feedback
        )

    def step(self, action: Action):
        if self.done:
            return self._get_obs(), 0.0, self.done, {"msg": "Environment is done."}

        self.steps_taken += 1
        feedback = "Action executed."
        
        if action.command != "noop":
            if action.email_id not in self.emails_dict:
                feedback = f"Error: Email ID {action.email_id} not found."
            else:
                email = self.emails_dict[action.email_id]
                if action.command == "classify":
                    email.category = action.category
                    feedback = f"Classified {email.id} as {action.category}."
                elif action.command == "reply":
                    email.status = "replied"
                    email.reply_text = action.message
                    feedback = f"Replied to {email.id}."
                elif action.command == "mark_priority":
                    email.priority_flag = True
                    feedback = f"Marked {email.id} as priority."
                elif action.command == "archive":
                    email.status = "archived"
                    feedback = f"Archived {email.id}."
                elif action.command == "delete":
                    email.status = "deleted"
                    feedback = f"Deleted {email.id}."

        if self.steps_taken >= self.max_steps:
            self.done = True

        return self._get_obs(feedback), 0.0, self.done, {}
