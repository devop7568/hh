# Prompt Generator

A CLI that creates **valid, structured prompts** for research, coding, writing, and advanced planning workflows.

## Basic usage

```bash
python3 prompt_generator.py coding "build a todo API" --constraints "Python 3.12, include tests"
```

## Less-common, high-quality templates

Use `--list-templates` to view all available templates:

```bash
python3 prompt_generator.py --list-templates
```

Advanced templates included:
- `red_team_review` (failure mode and risk-control analysis)
- `decision_memo` (trade-off-based executive recommendations)
- `experiment_design` (hypothesis-driven test planning)

## Online discovery + 5-stage enhancement

Use online discovery to collect and improve prompt ideas from public search snippets:

```bash
python3 prompt_generator.py writing "draft a product launch email" \
  --constraints "friendly tone, < 180 words" \
  --discover-online --max-candidates 200
```

Enhancement pipeline:
1. Normalize and deduplicate discovered snippets.
2. Rank by relevance to your topic.
3. Filter low-quality/noisy snippets.
4. Synthesize a structured prompt scaffold.
5. Add a final quality checklist.

## Safety

The CLI rejects unsafe requests that ask to bypass safeguards (for example jailbreak/bypass-safety requests).

## Run tests

```bash
python3 -m unittest -v
```
