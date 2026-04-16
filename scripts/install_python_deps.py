#!/usr/bin/env python3
"""One-click installer for backend Python dependencies."""

from __future__ import annotations

import argparse
import shlex
import subprocess
import sys
from pathlib import Path

MIN_PYTHON = (3, 11)
POETRY_VERSION = "2.0.1"


def print_error(message: str) -> None:
    print(f"[ERROR] {message}", file=sys.stderr)


def run(command: list[str], cwd: Path, dry_run: bool) -> None:
    pretty = " ".join(shlex.quote(part) for part in command)
    print(f"\n> {pretty}")
    if dry_run:
        return
    result = subprocess.run(command, cwd=cwd, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def ensure_python_version() -> None:
    if sys.version_info < MIN_PYTHON:
        major, minor = MIN_PYTHON
        current = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        print_error(
            f"Python {major}.{minor}+ is required, but found {current}. "
            "Please upgrade Python and retry."
        )
        raise SystemExit(1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Install backend Python dependencies in one command."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print commands without executing them.",
    )
    parser.add_argument(
        "--skip-pip-upgrade",
        action="store_true",
        help="Skip the pip self-upgrade step.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    ensure_python_version()

    project_root = Path(__file__).resolve().parents[1]
    api_dir = project_root / "api"
    if not api_dir.exists():
        print_error(f"Cannot find backend directory: {api_dir}")
        return 1

    print("DeepWiki backend dependency installer")
    print(f"Project root: {project_root}")
    print(f"Using Python: {sys.executable}")

    if not args.skip_pip_upgrade:
        run(
            [sys.executable, "-m", "pip", "install", "--upgrade", "pip"],
            project_root,
            args.dry_run,
        )
    run(
        [sys.executable, "-m", "pip", "install", f"poetry=={POETRY_VERSION}"],
        project_root,
        args.dry_run,
    )
    run(
        [sys.executable, "-m", "poetry", "install", "-C", "api", "--no-interaction"],
        project_root,
        args.dry_run,
    )

    if args.dry_run:
        print("\n[SUCCESS] Dry run completed. No packages were installed.")
    else:
        print("\n[SUCCESS] Python backend dependencies installed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
