# AI

Offline AI layer powered by **Ollama** — 100% local, no cloud, no API keys.

## What lives here

- Ollama client & model management (Qwen 2.5 · Gemma · Phi-3 Mini)
- Prompt templates & agents:
  - AI Assistant (ask, explain, quiz, summarize, study advice)
  - Study Planner (daily schedules)
  - Weak Topic Detection
  - Burnout Prediction
  - Quiz & Flashcard Generator
  - Notes Summarizer
  - Motivation Engine
  - **Learning DNA** — personal learning profile built over time
- Revision planning logic (spaced repetition)

## How it works

The backend (`backend/app/ai_service.py`) talks to Ollama over `127.0.0.1:11434`.
If no model is installed, every feature falls back to a deterministic offline
engine, so the app stays fully functional without AI.

## Privacy

No study data is ever sent to a remote server. Models run through Ollama locally.
