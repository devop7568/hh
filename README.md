# CRAFT Autonomous Agent System

Production-minded autonomous AI system in Python that implements:
- **Planner** (task decomposition)
- **Executor** (step execution)
- **Memory** (short + long term)
- **Reflection loop** (post-step scoring)
- **Optimization engine** (prompt logging, versioning, A/B behavior)
- **CRAFT prompt framework** for every step (Context, Role, Action, Format, Tone)

## Architecture

```text
User Goal
  -> PromptBuilder (CRAFT)
  -> Planner
  -> Executor
  -> Memory log
  -> Reflection
  -> Optimizer (score + prompt versioning)
  -> Repeat until complete
```

### Key modules

- `agentic_system/prompting/prompt_builder.py`: reusable CRAFT templates.
- `agentic_system/agent/planner.py`: decomposes goal into ordered steps.
- `agentic_system/agent/executor.py`: executes one step at a time.
- `agentic_system/memory/store.py`: short-term deque + JSONL long-term memory.
- `agentic_system/agent/reflection.py`: scores each step.
- `agentic_system/optimization/optimizer.py`: prompt history, scoring, version promotion.
- `agentic_system/llm/providers.py`: free/open providers (Ollama, local HF, OpenRouter free-tier, stub).
- `agentic_system/agent/multi_agent.py`: bonus multi-agent advisors.
- `agentic_system/tools/`: bonus tool abstractions.
- `agentic_system/plugins/plugin_manager.py`: plugin loader.

## Project structure

```text
agentic_system/
  agent/
    planner.py
    executor.py
    reflection.py
    multi_agent.py
  llm/providers.py
  memory/store.py
  optimization/optimizer.py
  plugins/plugin_manager.py
  prompting/prompt_builder.py
  tools/base.py
  tools/default_tools.py
  ui/api.py
  cli.py
  config.py
  runtime.py
examples/
  sample_prompts.md
tests/
  test_runtime.py
pyproject.toml
README.md
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Optional extras:
```bash
pip install -e .[web]
pip install -e .[local-llm]
```

## Run (CLI)

```bash
craft-agent run "Design and execute a local customer interview campaign" --provider stub --max-steps 5
```

Provider options:
- `stub` (offline test mode, no model dependency)
- `ollama` (local Ollama server)
- `hf-local` (local transformers)
- `openrouter` (free-tier models, optional key)

### Ollama example
```bash
ollama pull llama3.1:8b
craft-agent run "Build a roadmap for onboarding automation" --provider ollama --model llama3.1:8b
```


## Build a standalone executable (.exe)

You can package the CLI into a single executable with **PyInstaller** (free/open-source):

```bash
pip install -e .[build-exe]
python scripts/build_exe.py
```

- On **Windows**, output is `dist/craft-agent.exe`
- On Linux/macOS, output is `dist/craft-agent`

Run the built binary:
```bash
./dist/craft-agent run "Create a launch checklist" --provider stub
```

## Optional web API

```bash
uvicorn agentic_system.ui.api:app --reload
```

Then:
```bash
curl -X POST http://127.0.0.1:8000/run -H "content-type: application/json" -d '{"goal":"Create a launch checklist","provider":"stub"}'
```

## Optimization behavior

- Every executor prompt + output is stored in `.agent_data/optimization/prompt_records.jsonl`.
- Step reflection computes `accuracy`, `relevance`, `completion`, and total average score.
- Versions tracked in `.agent_data/optimization/prompt_versions.json`.
- If recent scores exceed threshold, prompt version is promoted automatically.

## Example goal ideas

- "Create a 2-week content strategy for a new SaaS blog."
- "Plan and validate a no-code MVP launch checklist."
- "Build a learning plan for mastering MLOps in 60 days."

## Notes on free model usage

This system intentionally avoids paid APIs by default. It runs fully offline with `--provider stub`, and can use local/open models via Ollama or local transformers.
