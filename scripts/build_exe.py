"""Build a standalone executable for the CRAFT agent CLI.

Usage:
  python scripts/build_exe.py

Requires:
  pip install pyinstaller
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENTRY = ROOT / "agentic_system" / "cli.py"
DIST = ROOT / "dist"


def main() -> int:
    if shutil.which("pyinstaller") is None:
        print("PyInstaller not found. Install it with: pip install pyinstaller")
        return 1

    cmd = [
        "pyinstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--name",
        "craft-agent",
        str(ENTRY),
    ]

    print("Running:", " ".join(cmd))
    result = subprocess.run(cmd, cwd=ROOT, check=False)
    if result.returncode != 0:
        return result.returncode

    # Windows emits .exe; Linux/macOS emits binary without extension.
    built = DIST / ("craft-agent.exe" if sys.platform.startswith("win") else "craft-agent")
    if built.exists():
        print(f"Success. Executable at: {built}")
        return 0

    print("Build command finished, but executable was not found in dist/.")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
