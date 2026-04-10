from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


class Tool(Protocol):
    name: str

    def run(self, **kwargs): ...


@dataclass
class ToolRegistry:
    tools: dict[str, Tool]

    def call(self, tool_name: str, **kwargs):
        return self.tools[tool_name].run(**kwargs)
