# Tests

StudyOS test suites.

## What lives here

- **Pytest** — unit, integration & API tests for `/backend` and `/ai`
- **Playwright** — end-to-end & UI tests for the Electron/React app
- Performance & accessibility test scripts

## Test pyramid

```
      UI / E2E   (Playwright)      ▲ few
     API tests   (Pytest)          ▲ some
  Unit / logic   (Pytest)          ▲ many
```

## Status

🚧 Placeholder — tests will be written alongside each feature (Phase 2 onward).
