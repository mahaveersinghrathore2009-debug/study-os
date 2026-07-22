import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square, Trash2 } from "lucide-react";
import type { Session, Subject } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Button, Card, EmptyState, Select, SectionTitle, TextArea } from "../components/ui";
import { DIFFICULTY_LABEL, MOOD_EMOJI, formatDateTime, formatDuration } from "../lib/format";

interface FlatTopic { id: number; name: string; depth: number }

export default function Study() {
  const subjects = useApp((s) => s.subjects);
  const loadSubjects = useApp((s) => s.loadSubjects);
  const toast = useApp((s) => s.toast);

  const [subjectId, setSubjectId] = useState<number>(0);
  const [topicId, setTopicId] = useState<number>(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<Session[]>([]);
  const [showFinish, setShowFinish] = useState(false);
  const [mood, setMood] = useState(3);
  const [difficulty, setDifficulty] = useState(3);
  const [notes, setNotes] = useState("");

  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    loadSubjects();
    api.sessions().then(setHistory).catch(() => {});
  }, [loadSubjects]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [running]);

  const topics = useMemo<FlatTopic[]>(() => {
    const out: FlatTopic[] = [];
    const walk = (list: Subject["topics"], depth: number) => {
      for (const t of list) {
        out.push({ id: t.id, name: t.name, depth });
        walk(t.children, depth + 1);
      }
    };
    const subj = subjects.find((s) => s.id === subjectId);
    if (subj) walk(subj.topics, 0);
    return out;
  }, [subjects, subjectId]);

  const start = async () => {
    if (!subjectId) return toast("Pick a subject first", "error");
    try {
      const s = await api.startSession({ subject_id: subjectId, topic_id: topicId || null });
      setSessionId(s.id);
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPaused(false);
      setRunning(true);
      setShowFinish(false);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const finish = async () => {
    if (!sessionId) return;
    setRunning(false);
    if (tickRef.current) window.clearInterval(tickRef.current);
    setShowFinish(true);
  };

  const confirmFinish = async () => {
    if (!sessionId) return;
    try {
      const s = await api.finishSession(sessionId, {
        duration_seconds: elapsed,
        mood,
        difficulty,
        notes: notes || undefined,
      });
      toast(`Logged ${formatDuration(s.duration_seconds)} — nice work!`, "success");
      setShowFinish(false);
      setSessionId(null);
      setElapsed(0);
      setNotes("");
      api.sessions().then(setHistory);
      loadSubjects();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const cancelFinish = () => {
    setShowFinish(false);
    setSessionId(null);
    setElapsed(0);
  };

  const del = async (id: number) => {
    await api.deleteSession(id);
    api.sessions().then(setHistory);
    toast("Session deleted", "info");
  };

  const display = running && !paused ? formatDuration(elapsed) : formatDuration(elapsed);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Study</h1>
        <p className="text-slate-400 mt-1">Log a focused session and the AI learns how you learn.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col items-center py-10">
          <div className="mb-6 w-full max-w-sm space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Subject</label>
              <Select value={subjectId} onChange={(e) => { setSubjectId(Number(e.target.value)); setTopicId(0); }} disabled={running}>
                <option value={0}>Select a subject…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Topic (optional)</label>
              <Select value={topicId} onChange={(e) => setTopicId(Number(e.target.value))} disabled={running}>
                <option value={0}>No topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{"  ".repeat(t.depth)}{t.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className={`font-mono text-7xl font-bold tabular-nums my-8 ${running ? "text-white" : "text-slate-400"}`}>
            {display}
          </div>

          <div className="flex items-center gap-4">
            {!running ? (
              <Button onClick={start} className="px-8 py-3 text-base"><Play size={18} /> Start Session</Button>
            ) : paused ? (
              <>
                <Button onClick={() => { setPaused(false); }} className="px-6"><Play size={16} /> Resume</Button>
                <Button variant="ghost" onClick={finish}><Square size={16} /> Finish</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setPaused(true)}><Pause size={16} /> Pause</Button>
                <Button variant="danger" onClick={finish}><Square size={16} /> Finish</Button>
              </>
            )}
          </div>
          {running && (
            <p className="text-xs text-slate-500 mt-4">
              {paused ? "Paused — resume when you're ready." : "Focus. The timer keeps your streak alive."}
            </p>
          )}
        </Card>

        <Card>
          <SectionTitle>Recent sessions</SectionTitle>
          {history.length === 0 ? (
            <EmptyState icon={<Play size={26} />} title="No sessions yet" sub="Finish your first session to start building your Learning DNA." />
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {history.slice(0, 20).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 text-sm border-b border-surface-600/50 pb-2.5">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{s.subject_name} {s.topic_name && <span className="text-slate-500">· {s.topic_name}</span>}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(s.started_at)} · {formatDuration(s.duration_seconds)}{s.mood ? ` · ${MOOD_EMOJI[s.mood - 1]}` : ""}</p>
                  </div>
                  <button onClick={() => del(s.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {showFinish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h3 className="text-lg font-semibold mb-1">Great session! 🎉</h3>
            <p className="text-sm text-slate-400 mb-4">You studied for <span className="font-mono text-accent-soft font-semibold">{formatDuration(elapsed)}</span>. How did it go?</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-2">How do you feel?</label>
                <div className="flex justify-between">
                  {MOOD_EMOJI.map((emoji, i) => (
                    <button key={i} onClick={() => setMood(i + 1)}
                      className={`text-2xl p-2 rounded-xl transition-all ${mood === i + 1 ? "bg-accent/25 scale-110" : "opacity-50 hover:opacity-90"}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1.5">Difficulty</label>
                <Select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                  {DIFFICULTY_LABEL.map((label, i) => i > 0 && <option key={i} value={i}>{label}</option>)}
                </Select>
              </div>
              <TextArea rows={3} placeholder="Quick note (what you learned, what was hard…)" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <div className="flex gap-3 pt-1">
                <Button className="flex-1" onClick={confirmFinish}>Save session</Button>
                <Button variant="ghost" onClick={cancelFinish}>Discard</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
