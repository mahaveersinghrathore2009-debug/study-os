# StudyOS

A private, local-first study companion that helps you organize subjects, log
focused study sessions, track your progress and prepare for exams — all on
your own computer.

**No account. No cloud. Your data never leaves your device.**

🟢 **Current status: Working prototype** - a packaged Windows desktop app
(Electron + installer) with a tested backend, in active development.

## 💸 100% Free & Private

**No paid APIs. No subscriptions. No accounts. No cloud.**

StudyOS runs entirely on your computer — everything is free and nothing
leaves your device:

- **No API keys** — the Study Assistant, quizzes and summaries run through a
  built-in local engine with no call to any paid cloud service. If you
  install [Ollama](https://ollama.com) (free, open source), AI models run on
  *your* machine — still no API keys, usage fees or credit limits.
- **Your data stays local** — sessions, notes, moods, flashcards and backups
  live in a local SQLite database on your PC. Nothing is uploaded, tracked
  or sold.
- **Works offline** — no internet connection required. Your study history,
  streaks and analytics are available anytime.
- **Free forever** — every library (FastAPI, React, SQLite, Electron, …) is
  open source, and the app itself is MIT-licensed. There are no tiers,
  paywalls or hidden costs.

The only "cost" is optional: downloading a local AI model via Ollama takes a
few GB of disk space.

## ✨ Features

- **Dashboard** — study streak, productivity score, daily/weekly goals, upcoming exams, recommendations
- **Study sessions** — start / pause / resume / finish with mood, difficulty and notes
- **Subjects** — Subject → Chapter → Topic → Subtopic hierarchy with mastery tracking
- **Focus Mode** — Pomodoro and custom timers with break suggestions
- **Study Assistant** — ask questions, explain concepts, plan revision, generate quizzes and summaries
- **Analytics** — line/bar/area/pie charts, GitHub-style heatmap, learning curve, burnout trend, exam readiness
- **Flashcards** — spaced repetition (SM-2)
- **Notes** — Markdown with code blocks and auto-save
- **Calendar** — exams, assignments, deadlines, study days
- **Goals** — daily / weekly / monthly / yearly
- **Mood tracker & Journal** — kept locally, feed burnout signals
- **Learning profile** — learns your best study hours, ideal session length and retention patterns
- **Encrypted backups** — export & restore, fully local
- **Accessibility** — dark / light / high-contrast themes, resizable fonts

## 🚀 How to install

> The full app lives on the **`develop`** branch.

```bash
# 1. Download
git clone https://github.com/mahaveersinghrathore2009-debug/study-os.git
cd study-os
git checkout develop

# 2. One-time setup  (needs Python 3.11+ and Node.js 20+)
scripts/setup.sh            # creates .venv, installs backend + frontend deps

# 3. Run
scripts/dev.sh              # backend on :8000, UI on http://localhost:5173
```

Open **http://localhost:5173**. That's it.

Details, manual steps and troubleshooting: **[docs/INSTALL.md](docs/INSTALL.md)**

## 🧱 Tech stack

| Layer | Technology |
|---|---|
| Frontend | React · TypeScript · TailwindCSS · Zustand · Apache ECharts |
| Desktop | Electron (Electron Builder) |
| Backend | FastAPI · SQLAlchemy · Pydantic |
| Database | SQLite |

## 📁 Project layout

```
backend/     FastAPI app (models, analytics, routers)
frontend/    React + TypeScript UI
desktop/     Electron shell & packaging
docs/        Documentation
scripts/     Setup & dev helpers
tests/       Unit + lifecycle tests
```

## License

MIT — see [LICENSE](LICENSE).
