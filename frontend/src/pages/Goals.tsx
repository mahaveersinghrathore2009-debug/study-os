import { useEffect, useState } from "react";
import { CheckCircle2, Flag, Plus, Target, Trash2 } from "lucide-react";
import type { Goal } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Badge, Button, Card, EmptyState, Input, Modal, ProgressBar, Select } from "../components/ui";
import { formatMinutes } from "../lib/format";

const PERIODS = ["daily", "weekly", "monthly", "yearly"] as const;

export default function Goals() {
  const subjects = useApp((s) => s.subjects);
  const toast = useApp((s) => s.toast);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: "", period: "weekly", unit: "hours", target: 4, subject_id: 0 });

  const load = () => api.goals().then(setGoals).catch(() => {});
  useEffect(load, []);

  const save = async () => {
    if (!form.title.trim() || form.target <= 0) return toast("Title and a positive target are required", "error");
    try {
      await api.createGoal({ ...form, title: form.title.trim(), subject_id: form.subject_id || null });
      toast("Goal created", "success");
      setModal(false);
      setForm({ title: "", period: "weekly", unit: "hours", target: 4, subject_id: 0 });
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const remove = async (id: number) => {
    await api.deleteGoal(id);
    load();
  };

  const periodIcon = (p: string) => (p === "daily" ? "🗓️" : p === "weekly" ? "📅" : p === "monthly" ? "📆" : "🗂️");

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-slate-400 mt-1">Daily, weekly, monthly or yearly — measured from real study sessions.</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> New goal</Button>
      </header>

      {goals.length === 0 ? (
        <Card><EmptyState icon={<Flag size={28} />} title="No goals yet" sub="Set a weekly goal like “Study 10 hours” — progress updates automatically as you study." /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const done = g.progress >= 0.999;
            return (
              <Card key={g.id} className={done ? "border-emerald-500/40" : ""}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{periodIcon(g.period)}</span>
                    <div>
                      <p className="font-semibold">{g.title}</p>
                      <p className="text-xs text-slate-500 capitalize">{g.period} · {g.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {done && <Badge color="#34d399"><CheckCircle2 size={12} /> Done</Badge>}
                    <button onClick={() => remove(g.id)} className="text-slate-600 hover:text-rose-400 p-1"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-400">
                    {g.unit === "hours" ? formatMinutes(g.progress * g.target * 60) : Math.round(g.progress * g.target)} / {g.target} {g.unit}
                  </span>
                  <span className="font-bold">{Math.round(g.progress * 100)}%</span>
                </div>
                <ProgressBar value={g.progress * 100} color={done ? "#34d399" : "#6366f1"} />
                {!done && <p className="text-xs text-slate-500 mt-2">{formatMinutes(g.remaining * 60)} to go</p>}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New goal">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Finish Algebra revision" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Period</label>
              <Select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Unit</label>
              <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <option value="hours">Hours</option>
                <option value="sessions">Sessions</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Target ({form.unit})</label>
            <Input type="number" min={0.5} step={0.5} value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1.5">Subject (optional)</label>
            <Select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: Number(e.target.value) })}>
              <option value={0}>All subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <Button className="w-full" onClick={save}><Target size={15} /> Create goal</Button>
        </div>
      </Modal>
    </div>
  );
}
