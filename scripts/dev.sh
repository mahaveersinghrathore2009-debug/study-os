#!/usr/bin/env bash
# StudyOS dev runner: backend (uvicorn) + frontend (vite) with one command.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PY=".venv/Scripts/python.exe"
[ -x "$PY" ] || PY=".venv/bin/python"

echo "==> Starting StudyOS backend on http://127.0.0.1:8000"
(cd backend && "$ROOT/$PY" -m uvicorn app.main:app --host 127.0.0.1 --port 8000) &
BACKEND_PID=$!

trap "kill $BACKEND_PID 2>/dev/null" EXIT

if command -v npm >/dev/null 2>&1; then
  echo "==> Starting frontend on http://localhost:5173"
  (cd frontend && npm run dev)
else
  echo "!! Node.js not found — backend only. Open http://127.0.0.1:8000/docs"
  wait $BACKEND_PID
fi
