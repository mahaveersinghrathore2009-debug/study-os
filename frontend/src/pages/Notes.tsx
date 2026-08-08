import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pin, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { marked } from "marked";
import type { Note } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Button, Card, EmptyState, Input, TextArea } from "../components/ui";
import { formatDateTime } from "../lib/format";

export default function Notes() {
  const toast = useApp((s) => s.toast);

  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Note | null>(null);
  const [preview, setPreview] = useState(false);
  const saveTimer = useRef<number | null>(null);

  const load = (q?: string) => api.notes(q).then(setNotes).catch(() => {});
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => notes.filter((n) => !search || n.title.toLowerCase().includes(search.toLowerCase())), [notes, search]);

  const select = (n: Note) => {
    setSelectedId(n.id);
    setDraft({ ...n });
    setPreview(false);
  };

  const create = async () => {
    try {
      const n = await api.createNote({ title: "Untitled note", content_md: "" });
      toast("Note created", "success");
      load();
      select(n);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const update = (patch: Partial<Note>) => {
    if (!draft) return;
    setDraft({ ...draft, ...patch });
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await api.updateNote(draft.id, { ...draft, ...patch });
        load();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    }, 600);
  };

  const togglePin = async () => {
    if (!draft) return;
    const updated = await api.updateNote(draft.id, { ...draft, pinned: !draft.pinned });
    setDraft(updated);
    load();
  };

  const remove = async () => {
    if (!draft) return;
    await api.deleteNote(draft.id);
    setDraft(null);
    setSelectedId(null);
    load();
    toast("Note deleted", "info");
  };

  const html = useMemo(() => (draft ? marked.parse(draft.content_md || "") : ""), [draft]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-slate-400 mt-1">Markdown notes with code blocks — all stored locally.</p>
        </div>
        <Button onClick={create}><Plus size={16} /> New note</Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input placeholder="Search notes…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Card className="p-2 space-y-1 max-h-[65vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-500 p-3">No notes found.</p>
            ) : (
              filtered.map((n) => (
                <button key={n.id} onClick={() => select(n)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition ${selectedId === n.id ? "bg-accent/15" : "hover:bg-surface-700/50"}`}>
                  <p className="font-medium text-sm truncate flex items-center gap-1.5">
                    {n.pinned && <Pin size={12} className="text-accent-soft shrink-0" />}
                    <span className="truncate">{n.title}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(n.updated_at)}</p>
                </button>
              ))
            )}
          </Card>
        </div>

        {draft ? (
          <Card className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Input value={draft.title} onChange={(e) => update({ title: e.target.value })} className="font-semibold text-base" />
              <Button variant="ghost" onClick={() => setPreview(!preview)}><Eye size={15} /> {preview ? "Edit" : "Preview"}</Button>
              <Button variant="ghost" onClick={togglePin}><Pin size={15} className={draft.pinned ? "text-accent-soft" : ""} /></Button>
              <Button variant="danger" onClick={remove}><Trash2 size={15} /></Button>
            </div>
            {preview ? (
              <div className="markdown-body prose-sm flex-1 overflow-y-auto px-1 py-2" dangerouslySetInnerHTML={{ __html: html as string }} />
            ) : (
              <TextArea
                rows={22}
                className="flex-1 font-mono text-sm leading-relaxed"
                placeholder={"# Heading\n\nWrite **markdown** here…\n\n```ts\nconst study = \"smart\";\n```"}
                value={draft.content_md}
                onChange={(e) => update({ content_md: e.target.value })}
              />
            )}
            <p className="text-xs text-slate-500 mt-2">Auto-saved locally. Supports headings, lists, code blocks and quotes.</p>
          </Card>
        ) : (
          <Card><EmptyState icon={<StickyNote size={28} />} title="Pick a note" sub="Select a note from the list or create a new one." /></Card>
        )}
      </div>
    </div>
  );
}
