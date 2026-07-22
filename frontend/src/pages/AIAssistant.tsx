import { useEffect, useRef, useState } from "react";
import { Brain, Bot, Cpu, Send, Sparkles } from "lucide-react";
import { marked } from "marked";
import type { DNA } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Badge, Button, Card, EmptyState, Input, Spinner } from "../components/ui";

interface Msg { role: "user" | "assistant"; content: string; used_ai?: boolean }

const QUICK_ACTIONS = [
  { label: "🗓️ Plan my day", run: "plan" },
  { label: "🔥 Motivate me", run: "motivate" },
  { label: "🧬 Learning DNA", run: "dna" },
  { label: "⚠️ Weak topics", run: "weak" },
  { label: "🫀 Burnout check", run: "burnout" },
  { label: "📝 Summarize notes", run: "summarize" },
  { label: "❓ Quiz me", run: "quiz" },
];

export default function AIAssistant() {
  const toast = useApp((s) => s.toast);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dna, setDna] = useState<DNA | null>(null);
  const [ollama, setOllama] = useState<{ ollama_available: boolean; installed_models: string[]; configured_model: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.aiStatus().then(setOllama).catch(() => {});
    api.aiDNA().then(setDna).catch(() => {});
    api.aiMotivate().then((r) => setMessages([{ role: "assistant", content: r.response, used_ai: r.used_ai }])).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content }]);
    setBusy(true);
    try {
      const history = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const r = await api.aiChat(content, history);
      setMessages((m) => [...m, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    }
    setBusy(false);
  };

  const quick = async (kind: string) => {
    setBusy(true);
    try {
      let r: { response: string; used_ai: boolean };
      if (kind === "plan") {
        r = await api.aiPlan();
        setMessages((m) => [...m, { role: "user", content: "Plan my day" }, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
      } else if (kind === "motivate") {
        r = await api.aiMotivate();
        setMessages((m) => [...m, { role: "user", content: "Motivate me 🔥" }, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
      } else if (kind === "dna") {
        const dnaData = await api.aiDNA();
        setDna(dnaData);
        setMessages((m) => [...m, { role: "assistant", content: dnaData.summary ?? "Keep studying — your Learning DNA needs more data.", used_ai: true }]);
      } else if (kind === "weak") {
        r = await api.aiChat("Which topics should I focus on?", []);
        setMessages((m) => [...m, { role: "user", content: "Show me my weak topics" }, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
      } else if (kind === "burnout") {
        r = await api.aiChat("Check my burnout risk", []);
        setMessages((m) => [...m, { role: "user", content: "Burnout check" }, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
      } else if (kind === "summarize") {
        const notes = await api.notes();
        if (!notes.length) {
          setMessages((m) => [...m, { role: "assistant", content: "You don't have any notes yet. Write one in the Notes tab and I'll summarize it." }]);
        } else {
          const text = notes.slice(0, 3).map((n) => n.content_md).join("\n\n");
          r = await api.aiSummarize(text.slice(0, 4000));
          setMessages((m) => [...m, { role: "user", content: "Summarize my notes" }, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
        }
      } else if (kind === "quiz") {
        const topic = window.prompt("Quiz topic:", "Algebra") ?? "Algebra";
        r = await api.aiQuiz(topic, 5, "MCQ");
        setMessages((m) => [...m, { role: "user", content: `Quiz me on ${topic}` }, { role: "assistant", content: r.response, used_ai: r.used_ai }]);
      }
    } catch (e) {
      toast((e as Error).message, "error");
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-slate-400 mt-1">Your offline study companion — ask, plan, quiz and summarize.</p>
        </div>
        {ollama && (
          <Badge color={ollama.ollama_available ? "#34d399" : "#fbbf24"}>
            <Cpu size={12} /> {ollama.ollama_available ? `Ollama · ${ollama.configured_model}` : "Offline engine"}
          </Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 flex flex-col p-0 overflow-hidden" style={{ height: "62vh" }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <EmptyState icon={<Bot size={28} />} title="Ask me anything" sub="Explain a concept, plan your revision, generate a quiz, or just vent about the syllabus." />
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 shrink-0 rounded-xl bg-accent/20 flex items-center justify-center text-accent-soft"><Bot size={16} /></div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-accent text-white rounded-br-sm" : "bg-surface-700/70 rounded-bl-sm"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} />
                  ) : (
                    <p>{m.content}</p>
                  )}
                  {m.role === "assistant" && m.used_ai !== undefined && (
                    <p className="text-[10px] text-slate-500 mt-2">{m.used_ai ? "🤖 local model" : "🧠 offline engine"}</p>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-slate-500 text-sm pl-11"><Spinner /> thinking…</div>}
            <div ref={endRef} />
          </div>
          <div className="border-t border-surface-600/60 p-3">
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any topic…"
                onKeyDown={(e) => e.key === "Enter" && send()} />
              <Button onClick={() => send()} disabled={busy}><Send size={15} /></Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles size={15} className="text-accent-soft" /> Quick actions</h3>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map((q) => (
                <button key={q.run} onClick={() => quick(q.run)} disabled={busy}
                  className="text-left rounded-xl bg-surface-700/50 hover:bg-surface-700 px-3.5 py-2.5 text-sm transition disabled:opacity-50">
                  {q.label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Brain size={15} className="text-accent-soft" /> Learning DNA</h3>
            {!dna ? (
              <p className="text-sm text-slate-500">Studying a bit more will unlock your personal learning profile…</p>
            ) : dna.empty ? (
              <p className="text-sm text-slate-500">{dna.summary}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {dna.best_hours?.[0] && <li>🕗 Best time: <span className="font-medium">{dna.best_hours[0].hour}:00</span></li>}
                {dna.ideal_length_min && <li>⏱️ Ideal session: <span className="font-medium">{dna.ideal_length_min} min</span></li>}
                {dna.strongest_subjects?.[0] && <li>🧠 Strongest: <span className="font-medium">{dna.strongest_subjects[0].subject}</span></li>}
                {dna.struggling_topics?.[0] && <li>⚠️ Focus: <span className="font-medium">{dna.struggling_topics[0].topic}</span></li>}
                {dna.learning_style?.hint && <li className="text-slate-400 text-xs leading-relaxed">{dna.learning_style.hint}</li>}
                {dna.ai_advice && <li className="text-slate-400 text-xs leading-relaxed border-t border-surface-600/60 pt-2">{dna.ai_advice}</li>}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
