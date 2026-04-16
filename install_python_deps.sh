#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

if command -v python3 >/dev/null 2>&1; then
  python3 scripts/install_python_deps.py "$@"
elif command -v python >/dev/null 2>&1; then
  python scripts/install_python_deps.py "$@"
else
  echo "[ERROR] Python 3.11+ not found in PATH. Install Python and retry." >&2
  exit 1
fi
