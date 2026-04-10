from __future__ import annotations

from pathlib import Path
from pydantic import BaseModel, Field


class OptimizerConfig(BaseModel):
    ab_test_ratio: float = 0.5
    min_examples_to_promote: int = 3


class RuntimeConfig(BaseModel):
    data_dir: Path = Field(default_factory=lambda: Path(".agent_data"))
    provider: str = "ollama"
    model: str = "llama3.1:8b"
    max_steps: int = 15
    optimizer: OptimizerConfig = Field(default_factory=OptimizerConfig)


DEFAULT_CONFIG = RuntimeConfig()
