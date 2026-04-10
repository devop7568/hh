from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from pathlib import Path

from agentic_system.schemas import Reflection


@dataclass
class PromptRecord:
    template: str
    version: int
    prompt_text: str
    output_text: str
    score: float


class OptimizationEngine:
    def __init__(self, data_dir: Path, ab_ratio: float = 0.5):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.records_file = self.data_dir / "prompt_records.jsonl"
        self.versions_file = self.data_dir / "prompt_versions.json"
        self.ab_ratio = ab_ratio
        if not self.versions_file.exists():
            self.versions_file.write_text(json.dumps({"planner": 1, "executor": 1, "reflection": 1}, indent=2))

    def current_version(self, template: str) -> int:
        versions = json.loads(self.versions_file.read_text())
        return int(versions.get(template, 1))

    def choose_variant(self, template: str, sample_idx: int) -> int:
        """Simple A/B: alternate baseline vs candidate every other item weighted by ratio."""
        v = self.current_version(template)
        if v < 2:
            return 1
        return 2 if (sample_idx % int(max(1, 1 / self.ab_ratio))) == 0 else 1

    def log_result(self, template: str, prompt_text: str, output_text: str, reflection: Reflection) -> None:
        record = PromptRecord(
            template=template,
            version=self.current_version(template),
            prompt_text=prompt_text,
            output_text=output_text,
            score=reflection.total,
        )
        with self.records_file.open("a", encoding="utf-8") as f:
            f.write(json.dumps(asdict(record)) + "\n")

    def maybe_promote_new_version(self, template: str, threshold: float = 0.83) -> bool:
        if not self.records_file.exists():
            return False
        scores: list[float] = []
        with self.records_file.open("r", encoding="utf-8") as f:
            for line in f:
                row = json.loads(line)
                if row["template"] == template:
                    scores.append(float(row["score"]))
        if len(scores) >= 3 and (sum(scores[-3:]) / 3.0) >= threshold:
            versions = json.loads(self.versions_file.read_text())
            versions[template] = int(versions.get(template, 1)) + 1
            self.versions_file.write_text(json.dumps(versions, indent=2))
            return True
        return False
