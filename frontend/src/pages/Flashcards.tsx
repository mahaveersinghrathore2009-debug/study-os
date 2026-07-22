import { useEffect, useMemo, useState } from "react";
import { Layers, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import type { Flashcard } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Badge, Button, Card, EmptyState, Modal, Select, TextArea } from "../components/ui";

export default function Flashcards() {
  const subjects = useApp((s) => s.subjects);
  const toast = useApp((s) => s.toast);

  const [due, setDue] = useState<Flashcard[]>([]);
  const [all, setAll] = useState<Flashcard[]>([]);
  const [subjectFilter, setSubjectFilter] = useState(0);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject_id: 0, topic_id: 0, front: "", back: "" });
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);

  const load = () => {
    api.flashcards(true).then(setDue).catch(() => {});
    api.flashcards().then(setAll).catch(() => {});
  };
  useEffect(load, []);

  const filteredDue = useMemo(
    () => due.filter((c) => !subjectFilter || c.subject_id === subjectFilter),
    [due, subjectFilter]
  );

  const create = async () => {
    if (!form.front.trim() || !form.back.trim()) return toast("Front and back are required", "error");
    try {
      await api.createFlashcard({ ...form, subject_id: form.subject_id || null, topic_id: form.topic_id || null });
      toast("Flashcard added", "success");
      setModal(false);
      setForm({ subject_id: 0, topic_id: 0, front: "", back: "" });
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const review = async (rating: "again" | "good" | "easy") => {
    const card = filteredDue[idx];
    if (!card) return;
    await api.reviewFlashcard(card.id, rating);
    setDoneCount((c) => c + 1);
    setFlipped(false);
    if (idx + 1 >= filteredDue.length) {
      setIdx(0);
      load();
    } else {
      setIdx(idx + 1);
    }
  };

  const remove = async (id: number) => {
    await api.deleteFlashcard(id);
    toast("Card deleted", "info");
    load();
  };

  const current = filteredDue[idx];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Flashcards</h1>
          <p className="text-slate-400 mt-1">Spaced repetition — review when the algorithm says so.</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> New card</Button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Badge color="#6366f1"><Sparkles size={12} /> {filteredDue.length} due today</Badge>
        <Badge color="#22d3ee"><Layers size={12} /> {all.length} total cards</Badge>
        {doneCount > 0 && <Badge color="#34d399">✓ {doneCount} reviewed this session</Badge>}
        <Select className="w-44 ml-auto" value={subjectFilter} onChange={(e) => { setSubjectFilter(Number(e.target.value)); setIdx(0); setFlipped(false); }}>
          <option value={0}>All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>

      {filteredDue.length === 0 ? (
        <Card>
          <EmptyState icon={<RotateCcw size={28} />} title="All caught up! 🎉" sub="No cards due right now. Add new cards or come back later — spaced repetition will schedule the next review." />
        </Card>
      ) : current ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
              <Card className={`min-h-[300px] flex flex-col justify-center text-center transition-all hover:scale-[1.005] ${flipped ? "border-accent/50" : ""}`}>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-4">
                  {flipped ? "Answer" : "Question"} · tap to {flipped ? "flip back" : "reveal"}
                </p>
                <p className="text-2xl font-semibold leading-relaxed">{flipped ? current.back : current.front}</p>
                <p className="text-xs text-slate-500 mt-6">
                  Card {idx + 1} of {filteredDue.length} · reviews: {current.reviews} · interval: {current.interval_days}d
                </p>
              </Card>
            </div>
            {flipped && (
              <div className="flex items-center justify-center gap-3 mt-4 animate-fade-in">
                <Button variant="danger" onClick={() => review("again")}>Again</Button>
                <Button variant="ghost" onClick={() => review("good")}>Good</Button>
                <Button onClick={() => review("easy")}>Easy</Button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Card>
              <h3 className="font-semibold mb-2">Your cards</h3>
              {all.length === 0 ? (
                <p className="text-sm text-slate-500">No cards yet.</p>
              ) : (
                <ul className="space-y-2 max-h-[380px] overflow-y-auto">
                  {all.slice(0, 30).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 text-sm border-b border-surface-600/50 pb-2">
                      <div className="min-w-0">
                        <p className="truncate">{c.front}</p>
                        <p className="text-xs text-slate-500">due {c.due_date} · {c.interval_days}d</p>
                      </div>
                      <button onClick={() => remove(c.id)} className="text-slate-600 hover:text-rose-400 p-1 shrink-0"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      <Modal open={modal} onClose={() => setModal(false)} title="New flashcard">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Subject</label>
            <Select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: Number(e.target.value), topic_id: 0 })}>
              <option value={0}>General</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Front (question)</label>
            <TextArea rows={2} value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} placeholder="What is the Pythagorean theorem?" />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Back (answer)</label>
            <TextArea rows={3} value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} placeholder="a² + b² = c² for right triangles" />
          </div>
          <Button className="w-full" onClick={create}>Add card</Button>
        </div>
      </Modal>
    </div>
  );
}
