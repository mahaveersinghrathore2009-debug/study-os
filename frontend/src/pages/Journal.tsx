import { useEffect, useState } from "react";
import { BookHeart, Save } from "lucide-react";
import type { JournalEntry } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Button, Card, EmptyState, Input, TextArea } from "../components/ui";
import { todayISO } from "../lib/format";

export default function Journal() {
  const toast = useApp((s) => s.toast);
  const [date, setDate] = useState(todayISO());
  const [content, setContent] = useState("");
  const [list, setList] = useState<JournalEntry[]>([]);

  const load = () => api.journalList().then(setList).catch(() => {});

  useEffect(() => {
    load();
    api.journal(date).then((e) => setContent(e.content)).catch(() => setContent(""));
  }, [date]);

  const save = async () => {
    try {
      await api.saveJournal({ entry_date: date, content });
      toast("Journal saved", "success");
      load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
        <p className="text-slate-400 mt-1">A private daily reflection — stored only on this device.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
            <span className="text-sm text-slate-500">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
          <TextArea rows={14} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder={"What happened today?\n\nWhat did you learn?\n\nWhat's on your mind?"} />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500">Tip: reflect for 2 minutes before bed.</p>
            <Button onClick={save}><Save size={15} /> Save entry</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><BookHeart size={16} className="text-accent-soft" /> Past entries</h3>
          {list.length === 0 ? (
            <EmptyState icon={<BookHeart size={24} />} title="No entries yet" sub="Your reflections will appear here, day by day." />
          ) : (
            <ul className="space-y-3 max-h-[460px] overflow-y-auto">
              {list.map((e) => (
                <li key={e.id}>
                  <button onClick={() => setDate(e.entry_date)}
                    className="w-full text-left rounded-xl bg-surface-700/40 hover:bg-surface-700 px-3.5 py-2.5 transition">
                    <p className="text-sm font-medium">{new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{e.content || "Empty entry"}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
