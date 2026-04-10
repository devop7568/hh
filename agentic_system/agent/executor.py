from __future__ import annotations

import json

from agentic_system.prompting.prompt_builder import PromptBuilder
from agentic_system.schemas import PlanStep, StepResult


class Executor:
    def __init__(self, llm, prompt_builder: PromptBuilder, tool_registry=None):
        self.llm = llm
        self.prompt_builder = prompt_builder
        self.tool_registry = tool_registry or {}

    def execute_step(self, goal: str, step: PlanStep, memory_summary: dict) -> StepResult:
        prompt = self.prompt_builder.build("executor", goal=goal, step=step.description, memory=memory_summary)
        raw = self.llm.generate(prompt.rendered)
        payload = json.loads(self._extract_json(raw))
        output = json.dumps(payload, indent=2)
        return StepResult(step_id=step.id, success=True, output=output)

    @staticmethod
    def _extract_json(text: str) -> str:
        start = text.find("{")
        end = text.rfind("}")
        return text[start : end + 1] if start != -1 and end != -1 else text
