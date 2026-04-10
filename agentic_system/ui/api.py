from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel

from agentic_system.config import RuntimeConfig
from agentic_system.runtime import AgentRuntime

app = FastAPI(title="CRAFAgent API")


class GoalRequest(BaseModel):
    goal: str
    provider: str = "stub"
    model: str = "llama3.1:8b"


@app.post("/run")
def run_goal(req: GoalRequest):
    runtime = AgentRuntime(RuntimeConfig(provider=req.provider, model=req.model))
    return runtime.run_goal(req.goal)
