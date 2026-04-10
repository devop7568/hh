from __future__ import annotations

import importlib
from dataclasses import dataclass, field


@dataclass
class PluginManager:
    loaded: dict[str, object] = field(default_factory=dict)

    def load(self, module_path: str) -> object:
        mod = importlib.import_module(module_path)
        self.loaded[module_path] = mod
        return mod
