# End-to-end tests (Playwright)

Not yet implemented. Planned coverage:

- App boots, backend reachable, dashboard renders stats
- Create subject → add chapter → log a session → streak updates
- Flashcards: create → review → interval reschedules
- The assistant responds via its built-in engine without a local model
- Analytics charts render with data

Setup once Node.js is available:

```bash
cd frontend && npm install -D @playwright/test && npx playwright install
```

Run with the dev server + backend up: `npx playwright test`.
