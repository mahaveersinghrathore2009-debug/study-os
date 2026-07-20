# Backend

The local StudyOS backend — **FastAPI · SQLAlchemy · Pydantic · SQLite**.

## What lives here

- FastAPI application (`app/`)
- SQLAlchemy models & SQLite database
- Pydantic schemas (request/response validation)
- REST API modules:
  - `auth` — local profile only, no accounts
  - `dashboard`, `subjects`, `study`, `calendar`, `goals`
  - `analytics`, `notes`, `flashcards`, `ai`, `settings`, `backup`

## Constraints

- **Offline-first**: binds to `127.0.0.1` only
- **SQL injection protection** via SQLAlchemy ORM (no raw SQL)
- Input validation on every endpoint (Pydantic)

## Status

🚧 Placeholder — scaffolding in progress (Phase 2).
