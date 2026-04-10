from __future__ import annotations

from dataclasses import asdict
from typing import Any

from agentic_system.agent.executor import Executor
from agentic_system.agent.multi_agent import MultiAgentCoordinator
from agentic_system.agent.planner import Planner
from agentic_system.agent.reflection import ReflectionEngine
from agentic_system.config import RuntimeConfig
from agentic_system.llm.providers import (
    DeterministicStubProvider,
    HuggingFaceLocalProvider,
    OllamaProvider,
    OpenRouterFreeProvider,
)
from agentic_system.memory.store import MemoryStore
from agentic_system.optimization.optimizer import OptimizationEngine
from agentic_system.prompting.prompt_builder import PromptBuilder


class AgentRuntime:
    def __init__(self, config: RuntimeConfig, openrouter_key: str | None = None):
        self.config = config
        self.memory = MemoryStore(config.data_dir)
        self.prompts = PromptBuilder()
        self.optimizer = OptimizationEngine(config.data_dir / "optimization", ab_ratio=config.optimizer.ab_test_ratio)
        self.coordinator = MultiAgentCoordinator()

        self.llm = self._resolve_provider(config.provider, config.model, openrouter_key)
        self.planner = Planner(self.llm, self.prompts)
        self.executor = Executor(self.llm, self.prompts)
        self.reflection = ReflectionEngine(self.llm, self.prompts)

    @staticmethod
    def _resolve_provider(provider: str, model: str, openrouter_key: str | None):
        if provider == "ollama":
            return OllamaProvider(model=model)
        if provider == "hf-local":
            return HuggingFaceLocalProvider(model=model)
        if provider == "openrouter":
            return OpenRouterFreeProvider(model=model, api_key=openrouter_key)
        return DeterministicStubProvider()

    def run_goal(self, goal: str) -> dict[str, Any]:
        memory_summary = self.memory.short_summary()
        plan = self.planner.create_plan(goal, memory_summary)
        history: list[dict[str, Any]] = []

        for idx, step in enumerate(plan[: self.config.max_steps], start=1):
            step.status = "in_progress"
            advice = self.coordinator.consult(step.description)
            self.memory.remember({"type": "advice", "step_id": step.id, "advice": advice})

            result = self.executor.execute_step(goal, step, self.memory.short_summary())
            step.status = "done" if result.success else "failed"
            self.memory.remember({"type": "result", **asdict(result)})

            review = self.reflection.review(goal, step.description, result, self.memory.short_summary())
            self.memory.remember({"type": "reflection", **asdict(review), "total": review.total})

            self.optimizer.log_result("executor", step.description, result.output, review)
            self.optimizer.maybe_promote_new_version("executor")

            history.append(
                {
                    "step": asdict(step),
                    "result": asdict(result),
                    "reflection": asdict(review) | {"total": review.total},
                    "advice": advice,
                }
            )

            if not result.success:
                break

        done = all(item["step"]["status"] == "done" for item in history) and len(history) > 0
        return {"goal": goal, "completed": done, "steps_executed": len(history), "history": history}
