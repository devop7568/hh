from __future__ import annotations

import json
from typing import Any

from agentic_system.prompting.prompt_builder import PromptBuilder
from agentic_system.schemas import PlanStep


class Planner:
    def __init__(self, llm, prompt_builder: PromptBuilder):
        self.llm = llm
        self.prompt_builder = prompt_builder

    def create_plan(self, goal: str, memory_summary: dict[str, Any]) -> list[PlanStep]:
        prompt = self.prompt_builder.build("planner", goal=goal, memory=memory_summary)
        raw = self.llm.generate(prompt.rendered)
        data = json.loads(self._extract_json(raw))
        return [PlanStep(id=s["id"], description=s["description"]) for s in data]

    @staticmethod
    def _extract_json(text: str) -> str:
        start = text.find("[") if "[" in text else text.find("{")
        end = text.rfind("]") if "]" in text else text.rfind("}")
        return text[start : end + 1] if start != -1 and end != -1 else text
