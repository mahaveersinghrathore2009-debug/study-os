# StudyOS

> **The Offline AI Study Companion That Respects Your Privacy.**

StudyOS is an offline-first, AI-powered desktop application that helps students
organize, study, revise, analyze progress, prevent burnout, and continuously improve.

**No account required. No data leaves your computer. AI runs locally (Ollama) —
with a built-in offline engine so everything works even before you install it.**

## ✨ Features

- **Dashboard** — streak, productivity score, today's focus, goals, upcoming exams, AI recommendation
- **Study sessions** — start / pause / resume / finish with mood, difficulty and notes
- **Subjects** — Subject → Chapter → Topic → Subtopic hierarchy with mastery tracking
- **Focus Mode** — Pomodoro + custom timers + break suggestions
- **Analytics** — line/bar/area/pie charts, GitHub-style heatmap, learning curve, burnout trend, exam readiness
- **Flashcards** — spaced repetition (SM-2)
- **Notes** — markdown with code blocks, auto-save
- **Calendar** — exams, assignments, deadlines, study days
- **Goals** — daily / weekly / monthly / yearly
- **Mood tracker & Journal** — stored locally, feeds burnout prediction
- **AI Assistant** — chat, planning, quizzes, summarizer, motivation, weak-topic detection
- **🧬 Learning DNA** — learns your best study hours, ideal session length, retention and burnout patterns
- **Encrypted backups** — export & restore, fully local
- **Accessibility** — dark/light/high-contrast themes, resizable fonts

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React · TypeScript · TailwindCSS · Zustand · Apache ECharts |
| Desktop | Electron (Electron Builder) |
| Backend | FastAPI · SQLAlchemy · Pydantic |
| Database | SQLite |
| AI | Ollama (Qwen 2.5 · Gemma · Phi-3) + built-in offline engine |

## 📥 Download & install

Full step-by-step guide (prerequisites, clone/ZIP, setup, run, local AI):
**[docs/INSTALL.md](docs/INSTALL.md)**

## Quick start

```bash
# one-time setup
./scripts/setup.sh        # Python venv + deps (npm install when Node.js is present)

# run everything
./scripts/dev.sh          # backend on :8000, frontend on :5173
```

Backend API docs: http://127.0.0.1:8000/docs · Frontend: http://localhost:5173

## Optional: local AI models

```bash
./scripts/model.sh qwen2.5:7b   # installs Ollama model, runs 100% locally
```

Without Ollama, StudyOS still answers, plans and analyzes using its deterministic
offline engine.

## Project structure

```
StudyOS/
├── frontend/    # React + TypeScript + Tailwind + Zustand (14 screens)
├── backend/     # FastAPI + SQLAlchemy + SQLite (12 tables, 12 API modules)
├── ai/          # AI prompts & model strategy (docs + plans)
├── desktop/     # Electron main process & packaging
├── shared/      # Shared type contracts
├── docs/        # Architecture, API reference, roadmap, guides
├── tests/       # Pytest unit tests (+ planned Playwright e2e)
├── scripts/     # setup, dev, backup, model scripts
└── assets/      # Icons & branding (coming)
```

## Status

v0.1.0 — backend ✅ verified (13 tests + live API), frontend ✅ builds (tsc + Vite),
desktop shell ✅, docs ✅, local AI ✅ (Ollama + qwen2.5:7b). See [docs/roadmap.md](docs/roadmap.md).

## Privacy promise

🔒 No account · 🏠 data stays in SQLite on this device · 🧠 AI never leaves `127.0.0.1`
· 🗄️ encrypted backups · 📴 works fully offline.
