#!/usr/bin/env python3
"""Generate structured, policy-compliant prompts for common assistant tasks."""

from __future__ import annotations

import argparse
import html
import re
import textwrap
import urllib.parse
import urllib.request
from dataclasses import dataclass


@dataclass(frozen=True)
class PromptTemplate:
    name: str
    intent: str
    sections: tuple[str, ...]


TEMPLATES: dict[str, PromptTemplate] = {
    "research": PromptTemplate(
        name="research",
        intent="Gather reliable information with citations and clear assumptions.",
        sections=(
            "Goal",
            "Background context",
            "Specific questions",
            "Constraints",
            "Output format",
        ),
    ),
    "coding": PromptTemplate(
        name="coding",
        intent="Request practical software help with verification steps.",
        sections=(
            "Task",
            "Environment",
            "Acceptance criteria",
            "Testing requirements",
            "Output format",
        ),
    ),
    "writing": PromptTemplate(
        name="writing",
        intent="Create or revise text for a specific audience and tone.",
        sections=(
            "Objective",
            "Audience",
            "Tone and style",
            "Must-include points",
            "Length + format",
        ),
    ),
    "red_team_review": PromptTemplate(
        name="red_team_review",
        intent="Evaluate a plan for weak assumptions, failure modes, and risk controls.",
        sections=(
            "System under review",
            "Threat model",
            "Failure scenarios",
            "Mitigations and controls",
            "Residual risk assessment",
            "Verification plan",
        ),
    ),
    "decision_memo": PromptTemplate(
        name="decision_memo",
        intent="Produce an executive-ready recommendation with trade-offs and next steps.",
        sections=(
            "Decision statement",
            "Options considered",
            "Trade-off matrix",
            "Recommendation",
            "Risks and unknowns",
            "90-day action plan",
        ),
    ),
    "experiment_design": PromptTemplate(
        name="experiment_design",
        intent="Design a rigorous experiment with measurable outcomes and controls.",
        sections=(
            "Hypothesis",
            "Primary metric",
            "Experimental groups",
            "Confounders and controls",
            "Success/stop criteria",
            "Analysis plan",
        ),
    ),
}

DISALLOWED_PATTERNS = (
    "jailbreak",
    "bypass safety",
    "disable safeguards",
    "evade filter",
    "malware",
)


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def build_prompt(template: PromptTemplate, topic: str, extra_constraints: str | None) -> str:
    lines = [
        f"You are helping with: {topic}",
        f"Intent: {template.intent}",
        "",
        "Please follow this structure:",
    ]

    for section in template.sections:
        lines.append(f"- {section}: <fill in details>")

    if extra_constraints:
        lines.extend(["", f"Additional constraints: {extra_constraints}"])

    lines.extend(
        [
            "",
            "Quality bar:",
            "- Ask clarifying questions if required information is missing.",
            "- Be factual, avoid speculation, and note uncertainty.",
            "- Keep the final answer concise but complete.",
        ]
    )

    return "\n".join(lines)


def is_disallowed_request(topic: str, constraints: str | None) -> bool:
    body = f"{topic} {constraints or ''}".lower()
    return any(pattern in body for pattern in DISALLOWED_PATTERNS)


def search_web_snippets(topic: str, max_candidates: int) -> list[str]:
    """Collect text snippets from DuckDuckGo HTML results for prompt inspiration."""
    query = urllib.parse.quote_plus(f"{topic} prompt examples")
    url = f"https://duckduckgo.com/html/?q={query}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 PromptGenerator/1.0"
        },
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        page = response.read().decode("utf-8", errors="ignore")

    matches = re.findall(r'<a[^>]*class="result__snippet"[^>]*>(.*?)</a>', page)
    cleaned = [normalize_text(html.unescape(re.sub(r"<[^>]+>", " ", m))) for m in matches]
    return [snippet for snippet in cleaned if snippet][:max_candidates]


def rank_snippets(snippets: list[str], topic: str) -> list[str]:
    keywords = {token for token in re.findall(r"[a-zA-Z0-9]+", topic.lower()) if len(token) > 2}

    def score(snippet: str) -> tuple[int, int]:
        words = {token for token in re.findall(r"[a-zA-Z0-9]+", snippet.lower())}
        overlap = len(keywords & words)
        return overlap, len(snippet)

    return sorted(snippets, key=score, reverse=True)


def five_stage_enhancement(
    template: PromptTemplate,
    topic: str,
    constraints: str | None,
    snippets: list[str],
) -> str:
    # Stage 1: normalize + deduplicate
    normalized = [normalize_text(s) for s in snippets if normalize_text(s)]
    deduped = list(dict.fromkeys(normalized))

    # Stage 2: relevance ranking
    ranked = rank_snippets(deduped, topic)

    # Stage 3: quality filtering (drop very short or noisy snippets)
    filtered = [s for s in ranked if len(s) >= 40 and not s.lower().startswith("ad ")]

    # Stage 4: synthesis into structured scaffold
    seed_points = filtered[:5]
    scaffold = build_prompt(template, topic, constraints)

    # Stage 5: polish with a concrete checklist derived from discovered examples
    if seed_points:
        examples_block = "\n".join(f"- {point}" for point in seed_points)
        return (
            f"{scaffold}\n\n"
            "Inspiration extracted from public prompt examples:\n"
            f"{examples_block}\n\n"
            "Final checklist:\n"
            "- Keep instructions specific and testable.\n"
            "- Include constraints, audience, and required output format.\n"
            "- Ask for missing details before executing."
        )

    return (
        f"{scaffold}\n\n"
        "Final checklist:\n"
        "- Keep instructions specific and testable.\n"
        "- Include constraints, audience, and required output format.\n"
        "- Ask for missing details before executing."
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate valid prompt scaffolds for common assistant workflows."
    )
    parser.add_argument(
        "template",
        nargs="?",
        choices=sorted(TEMPLATES.keys()),
        help="Template type to generate.",
    )
    parser.add_argument("topic", nargs="?", help="The task/topic you want help with.")
    parser.add_argument(
        "--constraints",
        default=None,
        help="Optional additional constraints to include.",
    )
    parser.add_argument(
        "--discover-online",
        action="store_true",
        help="Search online prompt examples and run the five-stage enhancement pipeline.",
    )
    parser.add_argument(
        "--max-candidates",
        type=int,
        default=200,
        help="Maximum number of discovered snippets to evaluate.",
    )
    parser.add_argument(
        "--list-templates",
        action="store_true",
        help="Print available templates and exit.",
    )
    return parser.parse_args()


def format_template_catalog() -> str:
    lines = ["Available templates:"]
    for key in sorted(TEMPLATES.keys()):
        template = TEMPLATES[key]
        lines.append(f"- {template.name}: {template.intent}")
    return "\n".join(lines)


def main() -> None:
    args = parse_args()
    if args.list_templates:
        print(format_template_catalog())
        return

    if not args.template or not args.topic:
        raise SystemExit("template and topic are required unless --list-templates is used")

    if is_disallowed_request(args.topic, args.constraints):
        raise SystemExit(
            "Refusing unsafe request. Please provide a benign task and constraints."
        )

    template = TEMPLATES[args.template]
    if args.discover_online:
        snippets = search_web_snippets(args.topic, args.max_candidates)
        prompt = five_stage_enhancement(template, args.topic, args.constraints, snippets)
    else:
        prompt = build_prompt(template, args.topic, args.constraints)

    print(textwrap.dedent(prompt).strip())


if __name__ == "__main__":
    main()
