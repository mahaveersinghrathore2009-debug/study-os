# Desktop

The Electron shell that hosts the StudyOS UI.

## What lives here

- Electron **main process** (`main.js`) — window management, lifecycle
- IPC bridge between the React UI and the local FastAPI backend
- Electron Builder configuration & packaging (Windows · macOS · Linux)
- Auto-update & installer tooling
- Native file handling (PDFs, images, voice recordings)

## Architecture

```
React Desktop UI  →  Electron Main Process  →  FastAPI Local Backend
                                                ↓
                                    SQLite · Ollama · File Storage
```

## Running

`main.js` spawns the FastAPI backend and loads the built frontend. For
development, `scripts/dev.sh` runs the backend and Vite dev server directly.
