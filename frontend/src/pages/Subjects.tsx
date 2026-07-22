import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Layers, Plus, Trash2 } from "lucide-react";
import type { Session, Subject, Topic } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Badge, Button, Card, EmptyState, Input, Modal, ProgressBar } from "../components/ui";
import { formatMinutes } from "../lib/format";

const PALETTE = ["#6366f1", "#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#f87171", "#60a5fa", "#2dd4bf", "#fb923c"];

interface SubjectForm { name: string; color: string; weekly_goal_hours: number; }

export default function Subjects() {
  const subjects = useApp((s) => s.subjects);
  const loadSubjects = useApp((s) => s.loadSubjects);
  const toast = useApp((s) => s.toast);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [modal, setModal] = useState<null | { mode: "create" } | { mode: "edit"; subject: Subject }>(null);
  const [form, setForm] = useState<SubjectForm>({ name: "", color: PALETTE[0], weekly_goal_hours: 4 });
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadSubjects();
    api.sessions().then(setSessions).catch(() => {});
  }, [loadSubjects]);

  const minutesBySubject = useMemo(() => {
    const m: Record<number, number> = {};
    for (const s of sessions) m[s.subject_id] = (m[s.subject_id] ?? 0) + s.duration_seconds;
    return m;
  }, [sessions]);

  const openCreate = () => { setForm({ name: "", color: PALETTE[subjects.length % PALETTE.length], weekly_goal_hours: 4 }); setModal({ mode: "create" }); };
  const openEdit = (s: Subject) => { setForm({ name: s.name, color: s.color, weekly_goal_hours: s.weekly_goal_hours }); setModal({ mode: "edit", subject: s }); };

  const saveSubject = async () => {
    if (!form.name.trim()) return toast("Name is required", "error");
    try {
      if (modal?.mode === "create") await api.createSubject({ ...form, name: form.name.trim() });
      else if (modal?.mode === "edit") await api.updateSubject(modal.subject.id, form);
      toast(modal?.mode === "create" ? "Subject created" : "Subject updated", "success");
      setModal(null);
      loadSubjects();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const removeSubject = async (s: Subject) => {
    if (!window.confirm(`Delete "${s.name}" and all its topics?`)) return;
    try {
      await api.deleteSubject(s.id);
      toast("Subject deleted", "info");
      if (selected === s.id) setSelected(null);
      loadSubjects();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const addTopic = async (subjectId: number, parentId: number | null) => {
    const name = window.prompt(parentId ? "Subtopic name:" : "Topic (chapter) name:");
    if (!name?.trim()) return;
    try {
      await api.createTopic({ subject_id: subjectId, parent_id: parentId, name: name.trim() });
      toast("Topic added", "success");
      if (parentId) setExpanded((e) => new Set(e).add(parentId));
      loadSubjects();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const updateMastery = async (t: Topic, mastery: number) => {
    await api.updateTopic(t.id, { subject_id: t.subject_id, parent_id: t.parent_id, name: t.name, mastery, difficulty: t.difficulty });
    loadSubjects();
  };

  const updateDifficulty = async (t: Topic, difficulty: number) => {
    await api.updateTopic(t.id, { subject_id: t.subject_id, parent_id: t.parent_id, name: t.name, mastery: t.mastery, difficulty });
    loadSubjects();
  };

  const removeTopic = async (t: Topic) => {
    if (!window.confirm(`Delete topic "${t.name}"?`)) return;
    await api.deleteTopic(t.id);
    toast("Topic deleted", "info");
    loadSubjects();
  };

  const selectedSubject = subjects.find((s) => s.id === selected) ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-slate-400 mt-1">Organize your world: Subject → Chapter → Topic → Subtopic.</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Add subject</Button>
      </header>

      {subjects.length === 0 ? (
        <Card><EmptyState icon={<BookOpen size={28} />} title="No subjects yet" sub="Create your first subject (e.g. Mathematics) and start building your study plan." /></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const mins = minutesBySubject[s.id] ?? 0;
            const topicCount = countTopics(s.topics);
            return (
              <Card key={s.id} className={`cursor-pointer transition-all hover:scale-[1.015] ${selected === s.id ? "ring-2 ring-accent/60" : ""}`}
                onClick={() => setSelected(selected === s.id ? null : s.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}22`, color: s.color }}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-slate-500">{topicCount} topic{topicCount === 1 ? "" : "s"} · {s.weekly_goal_hours}h/week goal</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg text-slate-500 hover:bg-surface-600/60 hover:text-slate-200" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                      <Layers size={15} />
                    </button>
                    <button className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-500/20 hover:text-rose-400" onClick={(e) => { e.stopPropagation(); removeSubject(s); }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Studied</span>
                    <span className="font-medium">{formatMinutes(mins)}</span>
                  </div>
                  <ProgressBar value={(mins / 60 / Math.max(s.weekly_goal_hours, 0.1)) * 100} color={s.color} />
                </div>
                {s.target_exam_date && (
                  <p className="text-xs text-slate-500 mt-3">📅 Exam: {s.target_exam_date}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {selectedSubject && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedSubject.color}22`, color: selectedSubject.color }}>
                <BookOpen size={16} />
              </div>
              <h2 className="font-semibold text-lg">{selectedSubject.name}</h2>
              <Badge color={selectedSubject.color}>{countTopics(selectedSubject.topics)} topics</Badge>
            </div>
            <Button variant="soft" onClick={() => addTopic(selectedSubject.id, null)}><Plus size={15} /> Add chapter</Button>
          </div>
          {selectedSubject.topics.length === 0 ? (
            <p className="text-sm text-slate-500">No chapters yet. Add chapters (e.g. “Algebra”), then topics, then subtopics.</p>
          ) : (
            <div className="space-y-2">
              {selectedSubject.topics.map((t) => (
                <TopicRow key={t.id} topic={t} color={selectedSubject.color} depth={0}
                  expanded={expanded} onToggle={(id) => setExpanded((e) => { const n = new Set(e); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onAddChild={(pid) => addTopic(selectedSubject.id, pid)}
                  onMastery={updateMastery} onDifficulty={updateDifficulty} onDelete={removeTopic} />
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "create" ? "New subject" : "Edit subject"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" autoFocus />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button key={c} onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-white scale-110" : "opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Weekly goal (hours)</label>
            <Input type="number" min={0.5} max={60} step={0.5} value={form.weekly_goal_hours}
              onChange={(e) => setForm({ ...form, weekly_goal_hours: Number(e.target.value) })} />
          </div>
          <Button className="w-full" onClick={saveSubject}>{modal?.mode === "create" ? "Create subject" : "Save changes"}</Button>
        </div>
      </Modal>
    </div>
  );
}

function countTopics(topics: Topic[]): number {
  return topics.reduce((acc, t) => acc + 1 + countTopics(t.children), 0);
}

function TopicRow({ topic, color, depth, expanded, onToggle, onAddChild, onMastery, onDifficulty, onDelete }: {
  topic: Topic; color: string; depth: number;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onMastery: (t: Topic, v: number) => void;
  onDifficulty: (t: Topic, v: number) => void;
  onDelete: (t: Topic) => void;
}) {
  const hasKids = topic.children.length > 0;
  const isOpen = expanded.has(topic.id);
  const masteryPct = Math.round(topic.mastery * 100);
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 hover:bg-surface-700/50 transition" style={{ marginLeft: depth * 20 }}>
        {hasKids ? (
          <button onClick={() => onToggle(topic.id)} className="text-slate-500 hover:text-slate-200">
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : <span className="w-4" />}
        <span className="font-medium text-sm flex-1 truncate">{topic.name}</span>
        <span className="text-[10px] text-slate-500 hidden sm:inline">difficulty {"★".repeat(topic.difficulty)}</span>
        <div className="w-20">
          <input type="range" min={0} max={100} value={masteryPct}
            onChange={(e) => onMastery(topic, Number(e.target.value) / 100)}
            className="w-full accent-[#6366f1]" title="Mastery %" />
        </div>
        <span className="text-xs font-semibold w-8 text-right" style={{ color }}>{masteryPct}%</span>
        <div className="flex gap-0.5">
          <button onClick={() => onAddChild(topic.id)} title="Add subtopic" className="p-1.5 rounded-lg text-slate-500 hover:bg-surface-600/60 hover:text-slate-200"><Plus size={14} /></button>
          <button onClick={() => onDelete(topic)} title="Delete" className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-500/20 hover:text-rose-400"><Trash2 size={14} /></button>
        </div>
      </div>
      {hasKids && isOpen && (
        <div className="space-y-1 mt-1">
          {topic.children.map((c) => (
            <TopicRow key={c.id} topic={c} color={color} depth={depth + 1}
              expanded={expanded} onToggle={onToggle} onAddChild={onAddChild}
              onMastery={onMastery} onDifficulty={onDifficulty} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
