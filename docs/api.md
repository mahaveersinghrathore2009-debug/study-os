# StudyOS API Reference

All endpoints are served by the local FastAPI backend at `http://127.0.0.1:8000`.
Interactive docs: `http://127.0.0.1:8000/docs` (Swagger UI).

## Health & meta

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Status + whether Ollama is detected |
| GET | `/` | App info |

## Subjects & topics

| Method | Path | Description |
|---|---|---|
| GET | `/api/subjects` | List subjects with full topic trees |
| POST | `/api/subjects` | Create subject `{name, color, weekly_goal_hours, target_exam_date}` |
| PATCH | `/api/subjects/{id}` | Update subject |
| DELETE | `/api/subjects/{id}` | Delete subject + topics |
| POST | `/api/subjects/topics` | Create topic `{subject_id, parent_id?, name, mastery, difficulty}` |
| PATCH | `/api/subjects/topics/{id}` | Update topic (mastery/difficulty) |
| DELETE | `/api/subjects/topics/{id}` | Delete topic |

## Study sessions

| Method | Path | Description |
|---|---|---|
| POST | `/api/sessions/start` | `{subject_id, topic_id?}` → running session |
| POST | `/api/sessions/{id}/finish` | `{duration_seconds?, mood?, difficulty?, notes?}` |
| GET | `/api/sessions` | Recent sessions (`?limit=50&subject_id=`) |
| DELETE | `/api/sessions/{id}` | Delete a session |

## Dashboard & analytics

| Method | Path | Description |
|---|---|---|
| GET | `/api/dashboard` | Today/week stats, streak, productivity, quote, exams, recommendation |
| GET | `/api/analytics/overview` | All chart datasets + heatmap + burnout + DNA inputs |
| GET | `/api/analytics/heatmap` | 26-week contribution grid |
| GET | `/api/analytics/learning-dna` | Personal learning profile |

## Goals, calendar

| Method | Path | Description |
|---|---|---|
| GET/POST/DELETE | `/api/goals` | Goals with live progress |
| GET | `/api/calendar/events?month=YYYY-MM` | Events grouped by day |
| GET/POST/DELETE | `/api/calendar/exams` | Exams |
| GET/POST/PATCH/DELETE | `/api/calendar/assignments` | Assignments |

## Notes, flashcards, mood, journal

| Method | Path | Description |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/notes` | Markdown notes (`?search=`) |
| GET/POST/DELETE | `/api/flashcards` | Cards (`?due=true`) |
| POST | `/api/flashcards/{id}/review` | `{rating: again\|good\|easy}` (SM-2) |
| GET/POST | `/api/mood` | Mood entries (1–5 + energy) |
| GET/PUT | `/api/journal` | Daily journal by `?entry_date=` |

## AI (Ollama + offline engine)

| Method | Path | Description |
|---|---|---|
| GET | `/api/ai/status` | Ollama availability + models |
| POST | `/api/ai/chat` | `{message, history?}` |
| POST | `/api/ai/summarize` | `{text}` |
| POST | `/api/ai/quiz` | `{topic, count, kind}` |
| POST | `/api/ai/plan` | Daily plan |
| POST | `/api/ai/motivate` | Encouragement |
| GET | `/api/ai/learning-dna` | Structured DNA report |
| GET | `/api/ai/weak-topics` | Weak topic list |
| GET | `/api/ai/burnout` | Burnout assessment |

## Settings & backup

| Method | Path | Description |
|---|---|---|
| GET/PUT | `/api/settings` | Theme, goals, pomodoro, ollama config |
| GET | `/api/backup/list` | Encrypted backup files |
| POST | `/api/backup/export` | Create encrypted backup |
| POST | `/api/backup/restore` | `{filename}` restore |

**Note:** every response is JSON; errors return `{"detail": "..."}`.
