import { NavLink, Outlet } from "react-router-dom";
import {
  BarChart3, Brain, Calendar, CheckSquare, Clock, Dumbbell, Flame,
  LayoutDashboard, Library, NotebookPen, Settings, Sparkles, StickyNote, X,
} from "lucide-react";
import { useApp } from "../store";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/study", label: "Study", icon: Clock },
  { to: "/focus", label: "Focus Mode", icon: Dumbbell },
  { to: "/subjects", label: "Subjects", icon: Library },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/goals", label: "Goals", icon: CheckSquare },
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/flashcards", label: "Flashcards", icon: Sparkles },
  { to: "/ai", label: "AI Assistant", icon: Brain },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/mood", label: "Mood", icon: NotebookPen },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);

  const sidebar = (
    <aside className="flex h-full w-60 flex-col border-r border-surface-600/60 bg-surface-800/60 backdrop-blur px-3 py-5">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-cyan-500 shadow-lg shadow-accent/30">
          <Brain size={22} className="text-white" />
        </div>
        <div>
          <p className="font-bold leading-none tracking-tight text-lg">StudyOS</p>
          <p className="text-[11px] text-slate-500 mt-1">Offline · Private · AI</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive
                  ? "bg-accent/15 text-white font-medium shadow-inner"
                  : "text-slate-400 hover:bg-surface-600/50 hover:text-slate-200"
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 px-2 text-[11px] leading-relaxed text-slate-600">
        🔒 100% offline · your data never leaves this device
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <div className="pointer-events-none fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl animate-slide-up ${
              t.kind === "error"
                ? "border-rose-500/40 bg-rose-950/90 text-rose-200"
                : t.kind === "success"
                ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
                : "border-accent/40 bg-surface-700/95 text-slate-200"
            }`}
          >
            <span>{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
