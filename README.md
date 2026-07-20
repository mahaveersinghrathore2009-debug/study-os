# StudyOS (working name)

> **The Offline AI Study Companion That Respects Your Privacy.**

StudyOS is an offline-first, AI-powered desktop application that helps students
organize, study, revise, analyze progress, prevent burnout, and continuously improve.

**No account required. No data leaves your computer. AI runs locally.**

## Vision

Students currently juggle notes, calendars, to-do lists, flashcards, Pomodoro timers,
AI chatbots, and progress trackers. StudyOS combines all of these into one intelligent
application — then goes further by learning *how* you learn, not just how much you study.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React · TypeScript · TailwindCSS · Zustand |
| Desktop | Electron (packaged with Electron Builder) |
| Backend | FastAPI · SQLAlchemy · Pydantic |
| Database | SQLite |
| AI | Ollama — Qwen 2.5 · Gemma · Phi-3 Mini |
| Charts | Apache ECharts |
| Testing | Pytest · Playwright |

## Project Structure

```
StudyOS/
├── frontend/    # React + TypeScript + TailwindCSS + Zustand UI
├── backend/     # FastAPI local backend (SQLAlchemy, Pydantic, SQLite)
├── ai/          # Ollama integration, prompts, AI agents & features
├── desktop/     # Electron main process & packaging (Electron Builder)
├── shared/      # Shared types & API contracts between frontend and backend
├── docs/        # Architecture, ER diagram, API docs, guides, roadmap
├── tests/       # Pytest (unit/integration/API) & Playwright (e2e/UI)
├── scripts/     # Dev, build, packaging, backup & utility scripts
└── assets/      # Icons, branding, images, sounds
```

## Documentation

- [Architecture](docs/README.md)
- [Roadmap](docs/README.md)
- [Developer Guide](docs/README.md)

## Status

🚧 **Phase 1 — Planning & Scaffolding.** This repository currently contains the
project skeleton only. No feature code has been written yet.

## Getting Started

*Installation instructions will be added once the frontend and backend are scaffolded
(Phase 2). No dependencies are installed yet.*
