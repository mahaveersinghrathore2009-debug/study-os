import { create } from "zustand";
import type { Settings, Subject } from "./types";
import { api } from "./lib/api";

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

interface AppState {
  settings: Settings | null;
  subjects: Subject[];
  toasts: Toast[];
  toastSeq: number;
  loadSettings: () => Promise<void>;
  loadSubjects: () => Promise<void>;
  toast: (message: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
  applySettings: (s: Settings) => void;
}

export const useApp = create<AppState>((set, get) => ({
  settings: null,
  subjects: [],
  toasts: [],
  toastSeq: 0,

  loadSettings: async () => {
    try {
      const s = await api.settings();
      set({ settings: s });
      applyTheme(s);
    } catch {
      /* backend down — keep defaults */
    }
  },

  loadSubjects: async () => {
    try {
      set({ subjects: await api.subjects() });
    } catch {
      /* backend down */
    }
  },

  toast: (message, kind = "info") => {
    const id = get().toastSeq + 1;
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }], toastSeq: id }));
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  applySettings: (s) => {
    set({ settings: s });
    applyTheme(s);
  },
}));

function applyTheme(s: Settings) {
  const root = document.documentElement;
  const body = document.body;
  root.classList.toggle("dark", s.theme !== "light");
  body.classList.toggle("light", s.theme === "light");
  body.classList.toggle("high-contrast", !!s.high_contrast);
  body.style.fontSize = `${Math.round(16 * (s.font_scale || 1))}px`;
}

export function useSettings(): Settings {
  return (
    useApp.getState().settings ?? {
      profile_name: "Student",
      theme: "dark",
      accent: "indigo",
      font_scale: 1,
      pomodoro_focus: 25,
      pomodoro_break: 5,
      pomodoro_long_break: 15,
      daily_goal_hours: 2,
      weekly_goal_hours: 14,
      ollama_url: "http://127.0.0.1:11434",
      ollama_model: "qwen2.5:7b",
      high_contrast: false,
    }
  );
}
