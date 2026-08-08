import { useEffect } from "react";
import { Coffee, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useApp, useSettings } from "../store";
import { useFocus } from "../focusStore";
import { Button, Card, Select } from "../components/ui";
import { formatDuration } from "../lib/format";

export default function Focus() {
  const settings = useSettings();
  const subjects = useApp((s) => s.subjects);
  const focus = useFocus();

  // Drive the countdown while this page is mounted. The store derives the
  // remaining time from endsAt, so time spent on other pages is not lost.
  useEffect(() => {
    const t = window.setInterval(() => useFocus.getState().tick(), 1000);
    return () => window.clearInterval(t);
  }, []);

  const switchMode = (mode: "pomodoro" | "custom") => {
    if (mode !== focus.mode) focus.setMode(mode);
  };

  const primary = () => {
    if (focus.phase === "break") {
      focus.start(settings.pomodoro_long_break * 60, "break");
    } else if (focus.remaining < focus.total) {
      // paused mid-block → continue from where we left off
      focus.resume();
    } else {
      const seconds = focus.mode === "pomodoro" ? settings.pomodoro_focus * 60 : focus.customMin * 60;
      focus.start(seconds, "focus");
    }
  };

  const pct = focus.total > 0 ? (focus.remaining / focus.total) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
        <p className="text-slate-400 mt-1">Distraction-free Pomodoro with smart break suggestions.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => switchMode("pomodoro")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${focus.mode === "pomodoro" ? "bg-accent/20 text-accent-soft border border-accent/30" : "text-slate-400 hover:text-slate-200"}`}>
          <Timer size={16} className="inline mr-1.5" />Pomodoro
        </button>
        <button onClick={() => switchMode("custom")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${focus.mode === "custom" ? "bg-accent/20 text-accent-soft border border-accent/30" : "text-slate-400 hover:text-slate-200"}`}>
          Custom timer
        </button>
        {focus.mode === "custom" && (
          <input type="number" min={1} max={180} value={focus.customMin}
            onChange={(e) => focus.setCustomMin(Number(e.target.value))}
            className="w-24 rounded-xl bg-surface-700/70 border border-surface-600 px-3 py-2 text-sm text-center outline-none focus:border-accent/60" />
        )}
        <Select value={focus.subjectId ?? 0} onChange={(e) => focus.setSubjectId(Number(e.target.value) || null)}
          className="w-52 sm:ml-auto" title="Attribute this focus time to a subject">
          <option value={0}>🎯 No subject (General)</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col items-center py-12">
          <div className="relative flex items-center justify-center">
            <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90">
              <circle cx="130" cy="130" r="112" fill="none" strokeWidth="12" className="stroke-surface-600/50" />
              <circle cx="130" cy="130" r="112" fill="none" strokeWidth="12" strokeLinecap="round"
                stroke={focus.phase === "break" ? "#34d399" : "#6366f1"}
                strokeDasharray={2 * Math.PI * 112}
                strokeDashoffset={2 * Math.PI * 112 * (1 - pct / 100)}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
                {focus.phase === "break" ? "Break" : focus.phase === "focus" ? "Focus" : "Ready"}
              </p>
              <p className="font-mono text-6xl font-bold tabular-nums">{formatDuration(focus.remaining)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-8">
            {!focus.running ? (
              <Button className="px-8 py-3 text-base" onClick={primary}>
                <Play size={18} /> {focus.phase === "break" ? "Start break" : focus.phase === "focus" && focus.remaining < focus.total ? "Resume" : "Start focus"}
              </Button>
            ) : (
              <Button variant="ghost" className="px-8" onClick={focus.pause}><Pause size={16} /> Pause</Button>
            )}
            <Button variant="ghost" onClick={focus.reset}><RotateCcw size={16} /> Reset</Button>
          </div>
          <p className="text-sm text-slate-400 mt-6">Pomodoros completed today: <span className="font-bold text-accent-soft">{focus.pomodoros}</span></p>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-2"><Coffee size={16} className="text-emerald-400" /><h3 className="font-semibold">Break suggestions</h3></div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>🌊 Stand up, stretch for 2 minutes</li>
              <li>💧 Drink water — hydration boosts recall</li>
              <li>👀 Look 20 feet away for 20 seconds</li>
              <li>🧘 Deep breaths: inhale 4s, exhale 6s ×5</li>
              {focus.pomodoros >= 4 && <li className="text-emerald-300">🥇 4 done — take a longer {settings.pomodoro_long_break}-min break!</li>}
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold mb-2">Current settings</h3>
            <p className="text-sm text-slate-400">Focus: <span className="text-slate-200 font-medium">{settings.pomodoro_focus} min</span></p>
            <p className="text-sm text-slate-400 mt-1">Short break: <span className="text-slate-200 font-medium">{settings.pomodoro_break} min</span></p>
            <p className="text-sm text-slate-400 mt-1">Long break: <span className="text-slate-200 font-medium">{settings.pomodoro_long_break} min</span></p>
            <p className="text-xs text-slate-500 mt-3">Adjust these in Settings.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
