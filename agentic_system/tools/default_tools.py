from __future__ import annotations

from pathlib import Path
import httpx


class WebSearchTool:
    name = "web_search"

    def run(self, query: str) -> str:
        # lightweight free endpoint via DuckDuckGo Instant Answer API
        url = "https://api.duckduckgo.com/"
        params = {"q": query, "format": "json", "no_html": 1}
        r = httpx.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        return data.get("AbstractText") or data.get("Heading") or "No result"


class FileWriteTool:
    name = "file_write"

    def run(self, path: str, content: str) -> str:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(content, encoding="utf-8")
        return f"Wrote {len(content)} chars to {p}"
