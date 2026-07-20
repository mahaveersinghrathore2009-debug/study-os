# Shared

Single source of truth for contracts between the frontend and backend.

## What lives here

- Shared TypeScript types
- Mirror Pydantic models in `/backend`
- API endpoint contracts & route constants
- Common enums (mood, difficulty, goal types, session status…)
- Constants (spaced-repetition intervals, streak rules, productivity scoring)

## Why

Both sides of the app must agree on the shape of every API payload.
Changes here ripple to both `/frontend` and `/backend`.

## Status

🚧 Placeholder — scaffolding in progress.
