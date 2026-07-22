# Backend

StudyOS local backend — **FastAPI · SQLAlchemy · Pydantic · SQLite**.

## Run

```bash
cd backend
../.venv/Scripts/python -m uvicorn app.main:app --port 8000
```

Interactive API docs: http://127.0.0.1:8000/docs

## Modules

- `app/models.py` — 12 tables: subjects, topics, study_sessions, goals, exams,
  assignments, notes, flashcards, journal_entries, mood_entries, ai_history, settings
- `app/analytics.py` — streaks, productivity score, heatmap, learning curve,
  burnout index, weak-topic detection, **Learning DNA**
- `app/ai_service.py` — Ollama client with a fully-functional deterministic offline engine
- `app/routers/` — 12 REST modules (subjects, study, dashboard, goals, calendar,
  notes, flashcards, mood/journal, analytics, ai, settings, backup)

## Tests

```bash
../.venv/Scripts/python -m pytest ../tests/unit -q
```
