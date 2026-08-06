# StudyOS Developer Guide

## Prerequisites

- Python 3.11+ (3.14 works)
- Node.js 20+ (for the frontend; **not currently installed on this machine**)
- Optional: a local model runner (e.g. [Ollama](https://ollama.com)) for assistant features

## Quick start

```bash
# one-time setup (venv + deps)
./scripts/setup.sh

# run backend + frontend together
./scripts/dev.sh
```

- Backend: http://127.0.0.1:8000 (API docs at `/docs`)
- Frontend: http://localhost:5173

## Manual start (backend only)

```bash
cd backend
../.venv/Scripts/python -m uvicorn app.main:app --port 8000
```

## Tests

```bash
.venv/Scripts/python -m pytest tests/unit -q
```

## Adding a feature (git flow)

```bash
git checkout develop
git checkout -b feature/your-feature
# ... code ...
git add . && git commit
git checkout develop && git merge feature/your-feature
```

## Project layout

```
backend/app/           FastAPI app (main, models, schemas, analytics, assistant service, routers/)
frontend/src/          React app (pages/, components/, lib/, store.ts, types.ts)
desktop/               Electron main process + packaging config
scripts/               setup.sh · dev.sh · backup.sh · model.sh
tests/                 pytest unit tests (tests/unit)
docs/                  Architecture, API, roadmap, guides
```

## Conventions

- Backend: FastAPI + Pydantic v2; every endpoint validates input.
- Frontend: TypeScript strict; UI kit in `components/ui.tsx`; state via Zustand.
- Colors: Tailwind `surface` scale + `accent` (indigo). Dark theme default.
- No new dependency without a good reason — offline-first and lean.
