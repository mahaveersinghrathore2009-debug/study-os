# StudyOS Architecture

```
                  ┌─────────────────────┐
                  │   React Desktop UI  │  frontend/ (Vite + TS + Tailwind + Zustand)
                  └──────────┬──────────┘
                             │  HTTP (127.0.0.1:5173 → 8000)
                  ┌──────────▼──────────┐
                  │ Electron Main Proc  │  desktop/ (spawns backend, loads UI)
                  └──────────┬──────────┘
                             │  spawns
                  ┌──────────▼──────────┐
                  │  FastAPI Local API  │  backend/ (SQLAlchemy + Pydantic)
                  └──┬───────┬───────┬──┘
                     │       │       │
          ┌──────────▼┐ ┌────▼────┐ ┌▼──────────────┐
          │  SQLite   │ │ Models  │ │  File storage │
          │  data/    │ │ :11434  │ │  data/backups │
          └───────────┘ └─────────┘ └───────────────┘
```

## Principles

- **Offline-first**: everything binds to `127.0.0.1`. No external calls, ever.
- **Always available**: every assistant feature has a deterministic fallback.
- **Single local database**: SQLite via SQLAlchemy ORM (SQL-injection-safe).
- **Shared contracts**: Pydantic schemas (backend) mirrored by TypeScript types (`frontend/src/types.ts`).

## Key components

| Component | Location | Responsibility |
|---|---|---|
| API entry | `backend/app/main.py` | FastAPI app, CORS, router wiring, startup |
| Models | `backend/app/models.py` | 12 SQLAlchemy tables |
| Analytics | `backend/app/analytics.py` | Streaks, productivity, heatmap, DNA, burnout |
| Assistant service | `backend/app/ai_service.py` | chat, quizzes, plans, summaries |
| Routers | `backend/app/routers/` | 12 REST modules |
| UI shell | `frontend/src/components/Layout.tsx` | Sidebar navigation, toasts |
| Charts | `frontend/src/components/Chart.tsx` | Apache ECharts wrapper |
| Desktop | `desktop/main.js` | Electron main process + backend launcher |

## Git strategy

```
main ─────────────► release/v1.0
  └── develop ───────► feature/dashboard, feature/analytics, feature/assistant, ...
```

## Data flow example (study session)

1. User presses **Start Session** in the Study screen.
2. `POST /api/sessions/start` creates a `running` row.
3. Frontend timer tracks elapsed seconds locally.
4. On **Finish**, `POST /api/sessions/{id}/finish` stores duration, mood, difficulty, notes.
5. The analytics engine folds the session into streaks, heatmap, DNA and burnout signals.
