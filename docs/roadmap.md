# StudyOS Roadmap

> Status tracking for the product plan (Phases 1–6).

## Phase 1 — Planning & Scaffolding ✅ (mostly done)

- [x] Project structure, git strategy (`main` / `develop` / `feature/*`)
- [x] Tech-stack selection (React, FastAPI, SQLite, Ollama, ECharts)
- [ ] UI design system finalization
- [ ] Branding & name finalization

## Phase 2 — Core App ✅ (v0.1.0 built)

- [x] FastAPI backend with SQLAlchemy + SQLite (12 tables)
- [x] Subjects → Chapters → Topics → Subtopics hierarchy
- [x] Study sessions (start / pause / resume / finish + mood, difficulty, notes)
- [x] Dashboard (streak, productivity score, goals, upcoming exams, AI recommendation)
- [x] React + TypeScript + Tailwind + Zustand frontend (14 screens)
- [x] Electron desktop shell that boots the backend automatically
- [x] Scripts (`setup.sh`, `dev.sh`, `backup.sh`, `model.sh`)

## Phase 3 — Analytics ✅ (built)

- [x] Charts: daily line, weekly bar, monthly area, subject pie
- [x] GitHub-style study heatmap, learning curve, productivity trend
- [x] Burnout trend + index, goal completion, exam readiness
- [x] Streak calendar, weak-topic detection

## Phase 4 — AI ✅ (built, needs Ollama to unlock full power)

- [x] Offline AI engine (deterministic, works with zero installs)
- [x] Ollama integration (chat, summarize, quiz, plan, motivate) with graceful fallback
- [x] **Learning DNA** — personal learning profile (best hours, ideal session length, style, burnout patterns)
- [ ] Revision planner (spaced-repetition calendar view)
- [ ] AI-generated flashcards from notes

## Phase 5 — Hardening ⏳

- [ ] Package with Electron Builder (Windows/macOS/Linux installers)
- [ ] Playwright e2e suite
- [ ] Performance & accessibility passes
- [ ] Automatic backup scheduling
- [ ] Password-protected app (optional encryption at rest)

## Phase 6 — Release

- [ ] Website & landing page
- [ ] GitHub public release
- [ ] User feedback loop

## Version 2 ideas

Voice commands · OCR for handwritten notes · Study groups (LAN) · Plugin system ·
Theme marketplace · Extension API · Wearable integration · Notion/Obsidian import ·
AI tutor personalities.
