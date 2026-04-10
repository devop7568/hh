from __future__ import annotations

import json

import typer
from rich.console import Console
from rich.panel import Panel

from agentic_system.config import RuntimeConfig
from agentic_system.runtime import AgentRuntime

app = typer.Typer(help="Autonomous CRAFT Agent CLI")
console = Console()


@app.command()
def run(
    goal: str = typer.Argument(..., help="High-level goal for the autonomous agent"),
    provider: str = typer.Option("stub", help="ollama | hf-local | openrouter | stub"),
    model: str = typer.Option("llama3.1:8b", help="Model identifier"),
    max_steps: int = typer.Option(10, help="Maximum number of plan steps"),
    data_dir: str = typer.Option(".agent_data", help="Directory for memory and optimization logs"),
    openrouter_key: str = typer.Option("", help="Optional OpenRouter API key for free-tier models"),
):
    cfg = RuntimeConfig(provider=provider, model=model, max_steps=max_steps, data_dir=data_dir)
    runtime = AgentRuntime(cfg, openrouter_key=openrouter_key or None)
    result = runtime.run_goal(goal)
    console.print(Panel.fit("Execution complete", title="CRAFT Agent"))
    console.print_json(json.dumps(result))


if __name__ == "__main__":
    app()
