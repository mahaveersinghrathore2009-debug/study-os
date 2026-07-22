#!/usr/bin/env bash
# StudyOS one-time setup: Python venv + backend deps + frontend deps.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Creating Python virtualenv (.venv)"
py -3 -m venv .venv || python3 -m venv .venv

PY=".venv/Scripts/python.exe"
[ -x "$PY" ] || PY=".venv/bin/python"

echo "==> Installing backend dependencies"
"$PY" -m pip install --upgrade pip -q
"$PY" -m pip install -r backend/requirements.txt -q

if command -v npm >/dev/null 2>&1; then
  echo "==> Installing frontend dependencies"
  (cd frontend && npm install)
else
  echo "!! Node.js not found — install it, then run: cd frontend && npm install"
fi

echo "==> Done. Start everything with: scripts/dev.sh"
