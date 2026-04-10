from __future__ import annotations

from dataclasses import dataclass


@dataclass
class SpecialistAgent:
    name: str
    specialty: str

    def advise(self, step: str) -> str:
        return f"[{self.name}:{self.specialty}] Advice for step '{step}': prioritize measurable outputs."


class MultiAgentCoordinator:
    def __init__(self):
        self.agents = [
            SpecialistAgent(name="PlannerPro", specialty="decomposition"),
            SpecialistAgent(name="QualityGuard", specialty="validation"),
        ]

    def consult(self, step_description: str) -> list[str]:
        return [agent.advise(step_description) for agent in self.agents]
