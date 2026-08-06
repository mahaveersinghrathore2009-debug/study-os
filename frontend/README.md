# Frontend

StudyOS desktop UI — **React · TypeScript · TailwindCSS · Zustand · Apache ECharts**.

## Screens (14)

Dashboard · Study · Focus Mode · Subjects · Calendar · Goals · Notes ·
Flashcards · Study Assistant · Analytics · Mood · Journal · Settings

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (backend must run on :8000)
npm run build      # type-checks + production build into dist/
```

## Stack notes

- State: Zustand store (`src/store.ts`) — settings, subjects, toasts, theming
- API: typed fetch client (`src/lib/api.ts`) → `http://127.0.0.1:8000`
- Charts: thin ECharts wrapper (`src/components/Chart.tsx`)
- Markdown: `marked` for note previews and assistant responses
- Types mirror backend Pydantic schemas (`src/types.ts` ↔ `backend/app/schemas.py`)
