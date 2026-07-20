# Frontend

The StudyOS desktop UI — **React · TypeScript · TailwindCSS · Zustand**.

## What lives here

- React application source (`src/`)
- TailwindCSS theme & design system
- Zustand stores for UI/application state
- Apache ECharts chart components (analytics)
- Screens: Dashboard, Subjects, Study, Calendar, Goals, Notes,
  Flashcards, AI Assistant, Focus Mode, Mood Tracker, Journal, Settings

## Architecture

The frontend runs inside Electron and talks to the **local FastAPI backend**
(`/backend`) over HTTP on `127.0.0.1` — never over the network.

## Status

🚧 Placeholder — scaffolding in progress (Phase 2).
