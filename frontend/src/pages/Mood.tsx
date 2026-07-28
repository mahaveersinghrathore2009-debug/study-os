import { useEffect, useState } from "react";
import { CloudSun, HeartPulse, Zap } from "lucide-react";
import type { MoodEntry } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Button, Card, EmptyState, SectionTitle, TextArea } from "../components/ui";
import { MOOD_EMOJI, MOOD_LABEL, todayISO } from "../lib/format";

export default function Mood() {
  const toast = useApp((s) => s.toast);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState("");

  const load = () => api.mood().then(setEntries).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      await api.logMood({ entry_date: todayISO(), mood, energy, note: note || undefined });
      toast("Mood logged 💙", "success");
      setNote("");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const avgMood = entries.length ? entries.reduce((a, e) => a + e.mood, 0) / entries.length : 0;
  const burnoutHint = avgMood <= 2.5 ? "Your mood has been low — consider a lighter day." : avgMood <= 3.5 ? "Your mood is steady. Keep your routine balanced." : "Great mood trend — you're thriving!";

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mood Tracker</h1>
        <p className="text-slate-400 mt-1">Log how you feel — StudyOS uses this to predict burnout and shape advice.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle>How are you feeling today?</SectionTitle>
          <div className="flex justify-between mb-6">
            {MOOD_EMOJI.map((emoji, i) => (
              <button key={i} onClick={() => setMood(i + 1)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-4 transition-all ${
                  mood === i + 1 ? "bg-accent/20 scale-110" : "opacity-50 hover:opacity-90 hover:bg-surface-700/50"}`}>
                <span className="text-4xl">{emoji}</span>
                <span className="text-xs text-slate-400">{MOOD_LABEL[i]}</span>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <p className="text-xs text-slate-500 mb-2">Energy level</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((e) => (
                <button key={e} onClick={() => setEnergy(e)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                    energy === e ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40" : "bg-surface-700/50 text-slate-400 hover:bg-surface-700"}`}>
                  {"⚡".repeat(e)}{"·".repeat(5 - e)}
                </button>
              ))}
            </div>
          </div>

          <TextArea rows={2} placeholder="Anything on your mind? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button className="mt-4 w-full" onClick={save}>Log today's mood</Button>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-2 mb-2"><HeartPulse size={16} className="text-rose-400" /><h3 className="font-semibold">Burnout signal</h3></div>
            <p className="text-sm text-slate-400">{burnoutHint}</p>
            <p className="text-xs text-slate-500 mt-3">Average mood (last {entries.length} days): <span className="font-semibold text-slate-300">{entries.length ? MOOD_EMOJI[Math.round(avgMood) - 1] : "—"}</span></p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 mb-2"><Zap size={16} className="text-cyan-400" /><h3 className="font-semibold">Recent</h3></div>
            {entries.length === 0 ? (
              <EmptyState icon={<CloudSun size={24} />} title="No moods logged" sub="Log a mood and your trend appears here." />
            ) : (
              <ul className="space-y-2">
                {entries.slice(-14).reverse().map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm border-b border-surface-600/50 pb-2 last:border-0">
                    <span className="text-slate-400">{e.entry_date}</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">{MOOD_EMOJI[e.mood - 1]}</span>
                      <span className="text-xs text-slate-500">{"⚡".repeat(e.energy)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
