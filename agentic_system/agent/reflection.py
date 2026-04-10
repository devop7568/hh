from __future__ import annotations

import json

from agentic_system.prompting.prompt_builder import PromptBuilder
from agentic_system.schemas import Reflection, StepResult


class ReflectionEngine:
    def __init__(self, llm, prompt_builder: PromptBuilder):
        self.llm = llm
        self.prompt_builder = prompt_builder

    def review(self, goal: str, step_description: str, result: StepResult, memory_summary: dict) -> Reflection:
        context = {**memory_summary, "step_description": step_description, "result": result.output}
        prompt = self.prompt_builder.build("reflection", goal=goal, step=step_description, memory=context)
        raw = self.llm.generate(prompt.rendered)
        data = json.loads(self._extract_json(raw))
        return Reflection(
            step_id=result.step_id,
            score_accuracy=float(data.get("accuracy", 0.5)),
            score_relevance=float(data.get("relevance", 0.5)),
            score_completion=float(data.get("completion", 0.5)),
            notes=data.get("notes", "No notes."),
        )

    @staticmethod
    def _extract_json(text: str) -> str:
        start = text.find("{")
        end = text.rfind("}")
        return text[start : end + 1] if start != -1 and end != -1 else text
