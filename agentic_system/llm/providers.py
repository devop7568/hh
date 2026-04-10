from __future__ import annotations

import json
import subprocess
from abc import ABC, abstractmethod

import httpx


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> str:
        raise NotImplementedError


class OllamaProvider(LLMProvider):
    def __init__(self, model: str = "llama3.1:8b"):
        self.model = model

    def generate(self, prompt: str) -> str:
        payload = {"model": self.model, "prompt": prompt, "stream": False}
        with httpx.Client(timeout=90) as client:
            r = client.post("http://localhost:11434/api/generate", json=payload)
            r.raise_for_status()
            return r.json()["response"]


class HuggingFaceLocalProvider(LLMProvider):
    """Uses local transformers pipeline. Requires optional deps."""

    def __init__(self, model: str = "distilgpt2"):
        self.model = model
        from transformers import pipeline

        self.pipe = pipeline("text-generation", model=model)

    def generate(self, prompt: str) -> str:
        out = self.pipe(prompt, max_new_tokens=220, do_sample=True, temperature=0.2)
        return out[0]["generated_text"]


class OpenRouterFreeProvider(LLMProvider):
    """Optional provider, can use free-tier with optional API key."""

    def __init__(self, model: str = "meta-llama/llama-3.1-8b-instruct:free", api_key: str | None = None):
        self.model = model
        self.api_key = api_key

    def generate(self, prompt: str) -> str:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
        }
        with httpx.Client(timeout=120) as client:
            r = client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]


class DeterministicStubProvider(LLMProvider):
    """Offline fallback for tests/demo without model process."""

    def generate(self, prompt: str) -> str:
        if "Decompose goal" in prompt:
            return json.dumps(
                [
                    {"id": "s1", "description": "Clarify success criteria"},
                    {"id": "s2", "description": "Execute main task"},
                    {"id": "s3", "description": "Validate output"},
                ]
            )
        if "Quality Reviewer" in prompt:
            return json.dumps(
                {"accuracy": 0.8, "relevance": 0.9, "completion": 0.85, "notes": "Meets baseline requirements."}
            )
        return json.dumps({"actions_taken": ["simulated_action"], "result": "completed", "next_recommendation": "continue"})
