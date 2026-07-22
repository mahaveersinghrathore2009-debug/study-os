import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, GraduationCap, Plus, Trash2 } from "lucide-react";
import type { Assignment, Exam } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Badge, Button, Card, Input, Modal, Select } from "../components/ui";
import { formatMinutes, todayISO } from "../lib/format";

type CalEvent = { kind: string; id: number; title: string; subject?: string | null; minutes?: number; status?: string };

export default function CalendarPage() {
  const subjects = useApp((s) => s.subjects);
  const toast = useApp((s) => s.toast);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [days, setDays] = useState<Record<string, CalEvent[]>>({});
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [modal, setModal] = useState<null | "exam" | "assignment">(null);
  const [form, setForm] = useState({ title: "", subject_id: 0, date: todayISO(), weight: 3, status: "pending" });

  const load = () => {
    api.calendarEvents(month).then((r) => setDays(r.days as Record<string, CalEvent[]>)).catch(() => {});
    api.exams().then(setExams).catch(() => {});
    api.assignments().then(setAssignments).catch(() => {});
  };

  useEffect(load, [month]);

  const grid = useMemo(() => buildGrid(month, days), [month, days]);

  const save = async () => {
    if (!form.title.trim()) return toast("Title is required", "error");
    try {
      if (modal === "exam") {
        await api.createExam({ title: form.title.trim(), subject_id: form.subject_id || null, exam_date: form.date, weight: form.weight });
        toast("Exam added", "success");
      } else {
        await api.createAssignment({ title: form.title.trim(), subject_id: form.subject_id || null, due_date: form.date, status: form.status });
        toast("Assignment added", "success");
      }
      setModal(null);
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const delExam = async (id: number) => { await api.deleteExam(id); load(); };
  const delAsg = async (id: number) => { await api.deleteAssignment(id); load(); };
  const toggleAsg = async (a: Assignment) => {
    await api.updateAssignment(a.id, { ...a, status: a.status === "done" ? "pending" : "done" });
    load();
  };

  const monthLabel = new Date(month + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = todayISO();

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-slate-400 mt-1">Exams, assignments, deadlines and study days at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="soft" onClick={() => setModal("exam")}><GraduationCap size={15} /> Exam</Button>
          <Button variant="soft" onClick={() => setModal("assignment")}><Plus size={15} /> Assignment</Button>
        </div>
      </header>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonth(prevMonth)} className="p-2 rounded-lg hover:bg-surface-600/60 text-slate-400"><ChevronLeft size={18} /></button>
          <h2 className="font-semibold text-lg flex items-center gap-2"><CalendarDays size={18} className="text-accent-soft" />{monthLabel}</h2>
          <button onClick={() => setMonth(nextMonth)} className="p-2 rounded-lg hover:bg-surface-600/60 text-slate-400"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.blankStart > 0 && <div className="col-span-1" style={{ gridColumn: `span ${grid.blankStart}` }} />}
          {grid.cells.map((cell) => {
            const evs = cell.events;
            return (
              <div key={cell.date}
                className={`min-h-[76px] rounded-xl border p-1.5 transition ${
                  cell.date === today
                    ? "border-accent/60 bg-accent/10"
                    : evs.length
                    ? "border-surface-600/80 bg-surface-700/40"
                    : "border-surface-600/40 bg-surface-800/40"
                }`}>
                <p className={`text-xs font-semibold mb-1 ${cell.date === today ? "text-accent-soft" : "text-slate-400"}`}>
                  {Number(cell.date.slice(8))}
                </p>
                <div className="space-y-0.5">
                  {evs.slice(0, 3).map((e, i) => (
                    <div key={i} className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate ${
                      e.kind === "exam" ? "bg-rose-500/20 text-rose-300"
                      : e.kind === "assignment" ? "bg-amber-500/20 text-amber-300"
                      : "bg-cyan-500/15 text-cyan-300"}`}>
                      {e.kind === "exam" ? "📝 " : e.kind === "assignment" ? "📌 " : ""}{e.title}{e.minutes ? ` · ${formatMinutes(e.minutes)}` : ""}
                    </div>
                  ))}
                  {evs.length > 3 && <p className="text-[10px] text-slate-500">+{evs.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap size={16} className="text-rose-400" /> Upcoming exams (90 days)</h3>
          {exams.length === 0 ? (
            <p className="text-sm text-slate-500">No exams scheduled. Add one to track exam readiness.</p>
          ) : (
            <ul className="space-y-2.5">
              {exams.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.subject_name ?? "General"} · {e.exam_date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={e.days_until !== null && e.days_until! <= 7 ? "#f87171" : "#a78bfa"}>
                      {e.days_until === 0 ? "today" : e.days_until ? `${e.days_until}d left` : ""}
                    </Badge>
                    <button onClick={() => delExam(e.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Plus size={16} className="text-amber-400" /> Assignments</h3>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-500">No assignments. Add one to keep deadlines in view.</p>
          ) : (
            <ul className="space-y-2.5">
              {assignments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <button onClick={() => toggleAsg(a)} className="flex items-center gap-2.5 min-w-0 text-left">
                    <span className={`h-4 w-4 rounded-md border shrink-0 ${a.status === "done" ? "bg-emerald-500 border-emerald-500" : "border-slate-500"}`}>
                      {a.status === "done" && "✓"}
                    </span>
                    <span className={`truncate ${a.status === "done" ? "line-through text-slate-500" : "font-medium"}`}>{a.title}</span>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500">{a.subject_name ?? "General"} · {a.due_date}</span>
                    <button onClick={() => delAsg(a.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "exam" ? "New exam" : "New assignment"}>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={modal === "exam" ? "e.g. Midterm — Calculus I" : "e.g. Problem set 4"} autoFocus />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Subject</label>
            <Select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: Number(e.target.value) })}>
              <option value={0}>General</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Date</label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          {modal === "exam" && (
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Importance (1-5)</label>
              <Select value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((w) => <option key={w} value={w}>{"★".repeat(w)}{"☆".repeat(5 - w)}</option>)}
              </Select>
            </div>
          )}
          {modal === "assignment" && (
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Status</label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="done">Done</option>
              </Select>
            </div>
          )}
          <Button className="w-full" onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}

function prevMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildGrid(month: string, days: Record<string, CalEvent[]>) {
  const [y, mo] = month.split("-").map(Number);
  const first = new Date(y, mo - 1, 1);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const blankStart = (first.getDay() + 6) % 7; // Monday-first
  const cells = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${month}-${String(d).padStart(2, "0")}`;
    cells.push({ date: iso, events: days[iso] ?? [] });
  }
  return { blankStart, cells };
}
