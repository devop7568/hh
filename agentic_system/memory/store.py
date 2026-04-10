from __future__ import annotations

import json
from collections import deque
from pathlib import Path
from typing import Any


class MemoryStore:
    """Hybrid short-term + long-term memory."""

    def __init__(self, data_dir: Path, short_term_size: int = 30):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.short_term: deque[dict[str, Any]] = deque(maxlen=short_term_size)
        self.long_term_file = self.data_dir / "long_term_memory.jsonl"

    def remember(self, item: dict[str, Any]) -> None:
        self.short_term.append(item)
        with self.long_term_file.open("a", encoding="utf-8") as f:
            f.write(json.dumps(item) + "\n")

    def short_summary(self) -> dict[str, Any]:
        return {
            "recent_events": list(self.short_term)[-5:],
            "count": len(self.short_term),
        }

    def search_long_term(self, keyword: str) -> list[dict[str, Any]]:
        if not self.long_term_file.exists():
            return []
        matches: list[dict[str, Any]] = []
        with self.long_term_file.open("r", encoding="utf-8") as f:
            for line in f:
                if keyword.lower() in line.lower():
                    matches.append(json.loads(line))
        return matches
