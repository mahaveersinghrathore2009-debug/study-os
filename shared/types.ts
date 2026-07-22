// ---------------------------------------------------------------------------
// StudyOS shared contracts.
//
// The canonical types live in `frontend/src/types.ts` (used by the React app)
// and mirror the Pydantic schemas in `backend/app/schemas.py`.
// Keep the three in sync when adding fields.
// ---------------------------------------------------------------------------

export type GoalPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type GoalUnit = "hours" | "sessions";
export type FlashcardRating = "again" | "good" | "easy";
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const API_BASE = "http://127.0.0.1:8000";
