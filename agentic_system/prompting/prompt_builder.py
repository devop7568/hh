from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from agentic_system.schemas import CRAFTPrompt


@dataclass
class PromptTemplate:
    name: str
    role: str
    output_format: str
    tone: str = "precise, actionable, and concise"


class PromptBuilder:
    """Transforms goals + context into strict CRAFT prompts."""

    def __init__(self) -> None:
        self.templates: dict[str, PromptTemplate] = {
            "planner": PromptTemplate(
                name="planner",
                role="Autonomous Planning Specialist",
                output_format="JSON list of step objects with id, description, dependencies",
                tone="strategic and deterministic",
            ),
            "executor": PromptTemplate(
                name="executor",
                role="Autonomous Task Executor",
                output_format="JSON object with actions_taken, result, next_recommendation",
                tone="direct and operational",
            ),
            "reflection": PromptTemplate(
                name="reflection",
                role="AI Quality Reviewer",
                output_format="JSON object with accuracy, relevance, completion, notes",
                tone="critical but constructive",
            ),
        }

    def register_template(self, template: PromptTemplate) -> None:
        self.templates[template.name] = template

    def build(self, template_name: str, *, goal: str, step: str | None = None, memory: dict[str, Any] | None = None) -> CRAFTPrompt:
        t = self.templates[template_name]
        context = f"Goal: {goal}\nMemory summary: {memory or {}}"
        action = f"Complete the task: {step}" if step else "Decompose goal into executable steps."
        rendered = (
            f"C: {context}\n"
            f"R: {t.role}\n"
            f"A: {action}\n"
            f"F: {t.output_format}\n"
            f"T: {t.tone}"
        )
        return CRAFTPrompt(
            context=context,
            role=t.role,
            action=action,
            format=t.output_format,
            tone=t.tone,
            rendered=rendered,
        )
