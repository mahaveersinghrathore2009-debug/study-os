# End-to-end tests (Playwright)

Not yet implemented. Planned coverage:

- App boots, backend reachable, dashboard renders stats
- Create subject → add chapter → log a session → streak updates
- Flashcards: create → review → interval reschedules
- AI assistant responds via offline engine without Ollama
- Analytics charts render with data

Setup once Node.js is available:

```bash
cd frontend && npm install -D @playwright/test && npx playwright install
```

Run with the dev server + backend up: `npx playwright test`.
