from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class CRAFTPrompt(BaseModel):
    context: str
    role: str
    action: str
    format: str
    tone: str
    rendered: str


class PlanStep(BaseModel):
    id: str
    description: str
    status: str = "pending"  # pending|in_progress|done|failed
    parent_id: str | None = None


class StepResult(BaseModel):
    step_id: str
    success: bool
    output: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Reflection(BaseModel):
    step_id: str
    score_accuracy: float
    score_relevance: float
    score_completion: float
    notes: str

    @property
    def total(self) -> float:
        return (self.score_accuracy + self.score_relevance + self.score_completion) / 3.0
