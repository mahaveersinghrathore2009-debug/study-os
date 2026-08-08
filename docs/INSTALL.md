# Installing & Running StudyOS

This guide covers getting StudyOS onto **your own laptop** — from downloading the
project to running the full app. Everything is offline and free.

---

## 1. Download the project

### Option A — Clone with Git (recommended, for development)

```bash
git clone https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git
cd <YOUR-REPO>
```

### Option B — Download as ZIP (no Git required)

1. Open your repository on GitHub
2. Click the green **<> Code** button → **Download ZIP**
3. Extract the ZIP anywhere you like (e.g. `C:\StudyOS`), then open a terminal in that folder

---

## 2. Check prerequisites

| Tool | Version | Why |
|---|---|---|
| **Python** | 3.11+ (3.12/3.13 recommended) | Backend (FastAPI) |
| **Node.js** | 20+ LTS | Frontend build (React/Vite) |
| **Local model runner (e.g. Ollama)** | latest | Optional — powers the Study Assistant |

Check what you have:

```bash
python --version      # Windows: py -3 --version
node --version
npm --version
```

- Python: [python.org/downloads](https://www.python.org/downloads/) — tick **"Add Python to PATH"**
- Node.js: [nodejs.org](https://nodejs.org/) — LTS version
- Local model runner (optional): [ollama.com/download](https://ollama.com/download)

---

## 3. One-time setup

```bash
# Windows
scripts/setup.bat        # (or run the steps below manually)

# macOS / Linux
./scripts/setup.sh
```

That creates a virtual environment, installs the backend Python packages, and
installs frontend dependencies. It won't touch anything outside the project folder.

### Manual setup (if you prefer)

```bash
# Backend
py -3 -m venv .venv                                  # create virtual environment
.venv\Scripts\pip install -r backend\requirements.txt   # install backend deps

# Frontend
cd frontend
npm install                                          # install frontend deps
cd ..
```

---

## 4. Run StudyOS

```bash
scripts/dev.sh        # starts backend (:8000) + frontend (:5173) together
```

Or run the two pieces in separate terminals:

```bash
# Terminal 1 — backend API (http://127.0.0.1:8000)
.venv\Scripts\python -m uvicorn app.main:app --app-dir backend --port 8000

# Terminal 2 — frontend UI (http://localhost:5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser. You're in.

> The backend API reference is at **http://127.0.0.1:8000/docs** while running.

---

## 5. Optional: local models (recommended)

StudyOS works fully out of the box — the Study Assistant ships with a built-in engine
for chat, planning, quizzes, weak-topic detection and Learning DNA. To unlock the
local language model (100% offline, nothing uploaded):

```bash
# 1. Make sure Ollama is installed and running (ollama.com/download)
ollama list            # should respond, not error

# 2. Pull a model (this downloads ~4.7 GB once)
ollama pull qwen2.5:7b

# Or, from the project:
scripts/model.sh qwen2.5:7b
```

Then in the app: **Settings → Local models** — confirm *"Local model ready"* and the model
name. Faster/lighter option: `ollama pull qwen2.5:3b` (≈2 GB).

---

## 6. Verify everything works

```bash
# Backend tests
.venv\Scripts\python -m pytest tests/

# Frontend type-check + production build
cd frontend && npm run build
```

You should see **13 tests passed** and a successful Vite build.

---

## 7. First steps in the app

1. **Subjects** → add a subject (e.g. *Mathematics*) → add a chapter → add a topic
2. **Study** → start a session, let it run, finish it (add mood + difficulty)
3. **Dashboard** → watch your streak and productivity update
4. **Study Assistant** → ask it anything, or try *Plan my day* / *Quiz me*
5. **Analytics** → heatmap, learning curve, burnout trend, exam readiness
6. **Settings → Backup** → create an encrypted backup of everything

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` not recognized | Install Python, tick *Add to PATH*, restart terminal |
| `npm` not recognized | Install Node.js LTS, restart terminal |
| Backend won't start (port busy) | `netstat -ano | findstr :8000`, kill the listed PID |
| Assistant says *built-in engine* | No local model running, or none pulled — see step 5 |
| Model replies slowly | Use `qwen2.5:3b` instead of `:7b` (Settings → Local models) |
| Data appears missing | Check `backend/data/` (SQLite DB) and restore a backup if needed |

---

## Project layout

```
StudyOS/
├── frontend/    # React + TypeScript + Tailwind + Zustand (14 screens)
├── backend/     # FastAPI + SQLAlchemy + SQLite (12 tables, 12 API modules)
├── desktop/     # Electron main process & packaging
├── shared/      # Shared type contracts
├── docs/        # Architecture, API reference, roadmap, guides
├── tests/       # Pytest unit tests
├── scripts/     # setup, dev, backup, model scripts
└── assets/      # Icons & branding
```

Every byte of your data lives in `backend/data/` on your machine. No account.
No cloud. No tracking.
