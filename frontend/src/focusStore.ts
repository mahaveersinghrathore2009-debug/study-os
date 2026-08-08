import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./lib/api";
import { useApp } from "./store";

export type FocusPhase = "idle" | "focus" | "break";
export type FocusMode = "pomodoro" | "custom";

interface FocusState {
  mode: FocusMode;
  customMin: number;
  phase: FocusPhase;
  running: boolean;
  remaining: number; // seconds left in the current phase
  total: number; // total seconds of the current phase (progress ring)
  pomodoros: number; // focus blocks completed today
  pomodorosDate: string; // local date the counter belongs to
  subjectId: number | null; // optional subject attribution for logging
  endsAt: number | null; // epoch ms when the running phase ends

  setMode: (mode: FocusMode) => void;
  setCustomMin: (min: number) => void;
  setSubjectId: (id: number | null) => void;
  start: (seconds: number, phase: "focus" | "break") => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  tick: () => void;
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Length (seconds) of a pomodoro phase from the current settings. */
function phaseSeconds(phase: "focus" | "break"): number {
  const s = useApp.getState().settings;
  const minutes = phase === "focus" ? s?.pomodoro_focus ?? 25 : s?.pomodoro_long_break ?? 15;
  return minutes * 60;
}

/** Length (seconds) shown when idle, based on the active mode. */
function idleSeconds(mode: FocusMode, customMin: number): number {
  const s = useApp.getState().settings;
  return mode === "pomodoro" ? (s?.pomodoro_focus ?? 25) * 60 : Math.max(1, customMin) * 60;
}

/** Log a completed focus block atomically as a finished study session. */
function recordFocusBlock(seconds: number, subjectId: number | null, startedAt: string) {
  api
    .logSession({
      subject_id: subjectId ?? null,
      topic_id: null,
      duration_seconds: seconds,
      notes: "Pomodoro focus",
      started_at: startedAt,
    })
    .catch(() => {
      /* backend offline — the block simply isn't recorded */
    });
}

export const useFocus = create<FocusState>()(
  persist(
    (set, get) => ({
      mode: "pomodoro",
      customMin: 30,
      phase: "idle",
      running: false,
      remaining: 25 * 60,
      total: 25 * 60,
      pomodoros: 0,
      pomodorosDate: "",
      subjectId: null,
      endsAt: null,

      setMode: (mode) => {
        const seconds = idleSeconds(mode, get().customMin);
        set({ mode, phase: "idle", running: false, remaining: seconds, total: seconds, endsAt: null });
      },

      setCustomMin: (min) => set({ customMin: Math.max(1, Math.min(180, Number.isFinite(min) ? min : 1)) }),

      setSubjectId: (id) => set({ subjectId: id }),

      start: (seconds, phase) => {
        const today = localToday();
        const st = get();
        set({
          phase,
          running: true,
          remaining: seconds,
          total: seconds,
          endsAt: Date.now() + seconds * 1000,
          pomodoros: st.pomodorosDate === today ? st.pomodoros : 0,
          pomodorosDate: today,
        });
      },

      pause: () => set({ running: false, endsAt: null }),

      resume: () => {
        const st = get();
        if (!st.remaining || st.remaining <= 0) return;
        set({ running: true, endsAt: Date.now() + st.remaining * 1000 });
      },

      reset: () => {
        const st = get();
        const seconds = idleSeconds(st.mode, st.customMin);
        set({ phase: "idle", running: false, remaining: seconds, total: seconds, endsAt: null });
      },

      tick: () => {
        const st = get();
        if (!st.running || !st.endsAt) return;
        // Derive from the wall clock so time away from this page counts.
        const remaining = Math.max(0, Math.ceil((st.endsAt - Date.now()) / 1000));
        if (remaining > 0) {
          if (remaining !== st.remaining) set({ remaining });
          return;
        }
        const today = localToday();
        if (st.phase === "focus") {
          recordFocusBlock(st.total, st.subjectId, new Date(st.endsAt - st.total * 1000).toISOString());
          useApp.getState().toast("Focus complete — take a break! ☕", "success");
          const len = phaseSeconds("break");
          set({
            pomodoros: st.pomodorosDate === today ? st.pomodoros + 1 : 1,
            pomodorosDate: today,
            phase: "break",
            running: false,
            remaining: len,
            total: len,
            endsAt: null,
          });
        } else {
          useApp.getState().toast("Break over — back to focus 💪", "info");
          const len = phaseSeconds("focus");
          set({ phase: "focus", running: false, remaining: len, total: len, endsAt: null });
        }
      },
    }),
    { name: "studyos-focus" }
  )
);
