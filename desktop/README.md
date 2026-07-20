# Desktop

The Electron shell that hosts the StudyOS UI.

## What lives here

- Electron **main process** (window management, lifecycle)
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

## Status

🚧 Placeholder — scaffolding in progress (Phase 2).
