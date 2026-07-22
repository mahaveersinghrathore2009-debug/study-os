// Thin typed client for the local StudyOS backend. Everything runs on
// 127.0.0.1 — no request ever leaves the machine.
import type {
  AnalyticsOverview,
  Assignment,
  DashboardData,
  DNA,
  Exam,
  Flashcard,
  Goal,
  JournalEntry,
  MoodEntry,
  Note,
  Session,
  Settings,
  Subject,
} from "../types";

const BASE = "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

const get = <T>(p: string) => request<T>(p);
const post = <T>(p: string, body: unknown) => request<T>(p, { method: "POST", body: JSON.stringify(body) });
const put = <T>(p: string, body: unknown) => request<T>(p, { method: "PUT", body: JSON.stringify(body) });
const patch = <T>(p: string, body: unknown) => request<T>(p, { method: "PATCH", body: JSON.stringify(body) });
const del = <T>(p: string) => request<T>(p, { method: "DELETE" });

export const api = {
  // subjects
  subjects: () => get<Subject[]>("/api/subjects"),
  createSubject: (b: Partial<Subject>) => post<Subject>("/api/subjects", b),
  updateSubject: (id: number, b: Partial<Subject>) => patch<Subject>(`/api/subjects/${id}`, b),
  deleteSubject: (id: number) => del(`/api/subjects/${id}`),
  createTopic: (b: { subject_id: number; parent_id?: number | null; name: string; mastery?: number; difficulty?: number }) =>
    post<{ id: number }>("/api/subjects/topics", b),
  updateTopic: (id: number, b: unknown) => patch<{ id: number }>(`/api/subjects/topics/${id}`, b),
  deleteTopic: (id: number) => del(`/api/subjects/topics/${id}`),

  // study sessions
  startSession: (b: { subject_id: number; topic_id?: number | null }) => post<Session>("/api/sessions/start", b),
  finishSession: (id: number, b: { duration_seconds?: number; mood?: number; difficulty?: number; notes?: string }) =>
    post<Session>(`/api/sessions/${id}/finish`, b),
  sessions: () => get<Session[]>("/api/sessions?limit=100"),
  deleteSession: (id: number) => del(`/api/sessions/${id}`),

  // dashboard & analytics
  dashboard: () => get<DashboardData>("/api/dashboard"),
  analytics: () => get<AnalyticsOverview>("/api/analytics/overview"),

  // goals
  goals: () => get<Goal[]>("/api/goals"),
  createGoal: (b: Partial<Goal>) => post<Goal>("/api/goals", b),
  deleteGoal: (id: number) => del(`/api/goals/${id}`),

  // calendar
  calendarEvents: (month: string) => get<{ days: Record<string, unknown[]> }>(`/api/calendar/events?month=${month}`),
  exams: () => get<Exam[]>("/api/calendar/exams?days=90"),
  createExam: (b: Partial<Exam>) => post<Exam>("/api/calendar/exams", b),
  deleteExam: (id: number) => del(`/api/calendar/exams/${id}`),
  assignments: () => get<Assignment[]>("/api/calendar/assignments?days=90"),
  createAssignment: (b: Partial<Assignment>) => post<Assignment>("/api/calendar/assignments", b),
  updateAssignment: (id: number, b: Partial<Assignment>) => patch<Assignment>(`/api/calendar/assignments/${id}`, b),
  deleteAssignment: (id: number) => del(`/api/calendar/assignments/${id}`),

  // notes
  notes: (search?: string) => get<Note[]>(`/api/notes?${search ? `search=${encodeURIComponent(search)}` : "limit=200"}`),
  createNote: (b: Partial<Note>) => post<Note>("/api/notes", b),
  updateNote: (id: number, b: Partial<Note>) => patch<Note>(`/api/notes/${id}`, b),
  deleteNote: (id: number) => del(`/api/notes/${id}`),

  // flashcards
  flashcards: (due = false) => get<Flashcard[]>(`/api/flashcards?${due ? "due=true" : ""}`),
  createFlashcard: (b: Partial<Flashcard>) => post<Flashcard>("/api/flashcards", b),
  reviewFlashcard: (id: number, rating: "again" | "good" | "easy") =>
    post<Flashcard>(`/api/flashcards/${id}/review`, { rating }),
  deleteFlashcard: (id: number) => del(`/api/flashcards/${id}`),

  // mood & journal
  mood: () => get<MoodEntry[]>("/api/mood?days=30"),
  logMood: (b: { entry_date: string; mood: number; energy: number; note?: string }) => post<MoodEntry>("/api/mood", b),
  journal: (entry_date: string) => get<JournalEntry>(`/api/journal?entry_date=${entry_date}`),
  journalList: () => get<JournalEntry[]>("/api/journal/list?limit=60"),
  saveJournal: (b: { entry_date: string; content: string }) => put<JournalEntry>("/api/journal", b),

  // AI
  aiStatus: () => get<{ ollama_available: boolean; ollama_url: string; configured_model: string; installed_models: string[] }>("/api/ai/status"),
  aiChat: (message: string, history: { role: string; content: string }[]) =>
    post<{ response: string; used_ai: boolean }>("/api/ai/chat", { message, history }),
  aiSummarize: (text: string) => post<{ response: string; used_ai: boolean }>("/api/ai/summarize", { text }),
  aiQuiz: (topic: string, count: number, kind: string) =>
    post<{ response: string; used_ai: boolean }>("/api/ai/quiz", { topic, count, kind }),
  aiPlan: () => post<{ response: string; used_ai: boolean }>("/api/ai/plan", {}),
  aiMotivate: () => post<{ response: string; used_ai: boolean }>("/api/ai/motivate", {}),
  aiDNA: () => get<DNA>("/api/ai/learning-dna"),
  aiWeakTopics: () => get<{ topics: unknown[] }>("/api/ai/weak-topics"),
  aiBurnout: () => get<{ risk: number; level: string; reasons: string[]; tip: string; total_hours: number }>("/api/ai/burnout"),

  // settings & backup
  settings: () => get<Settings>("/api/settings"),
  updateSettings: (b: Partial<Settings>) => put<Settings>("/api/settings", b),
  backupList: () => get<{ filename: string; size: number; created: string }[]>("/api/backup/list"),
  backupExport: () => post<{ filename: string; bytes: number; tables: string[] }>("/api/backup/export", {}),
  backupRestore: (filename: string) => post<{ ok: boolean; tables: string[] }>("/api/backup/restore", { filename }),
};
