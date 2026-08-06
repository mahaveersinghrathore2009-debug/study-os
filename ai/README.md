# Assistant

Local assistant features that run entirely on your machine — no cloud, no
accounts, no uploads.

## What lives here

- Assistant service (ask, explain, quiz, summarize, study advice)
- Study Planner (daily schedules)
- Weak Topic Detection
- Burnout Prediction
- Quiz & Flashcard generation
- Notes Summarizer
- Motivation Engine
- Learning profile — personal study patterns built over time
- Revision planning logic (spaced repetition)

## How it works

The backend (`backend/app/ai_service.py`) powers these features. Everything
has a deterministic built-in fallback, so the app stays fully functional
without any extra setup or downloads.

## Privacy

No study data is ever sent to a remote server.
