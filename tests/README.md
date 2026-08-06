# Tests

StudyOS test suites.

## What lives here

- `unit/test_analytics.py` — analytics engine tests (streaks, productivity,
  learning DNA, burnout, backup table ordering)
- `lifecycle_check.py` — headless end-to-end check that drives the live API
  (subjects → session → analytics → flashcards → backup → cleanup)
- `e2e/` — Playwright end-to-end tests for the desktop UI (planned)

## Run

```bash
.venv/Scripts/python -m pytest tests/
```
