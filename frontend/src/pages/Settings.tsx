import { useEffect, useState } from "react";
import { Archive, Database, Download, Palette, ShieldCheck, Timer, User } from "lucide-react";
import type { Settings as SettingsType } from "../types";
import { api } from "../lib/api";
import { useApp } from "../store";
import { Badge, Button, Card, Input, Select } from "../components/ui";

export default function Settings() {
  const { settings, applySettings, toast } = useApp();
  const [form, setForm] = useState<SettingsType | null>(settings);
  const [ollama, setOllama] = useState<{ ollama_available: boolean; installed_models: string[]; configured_model: string } | null>(null);
  const [backups, setBackups] = useState<{ filename: string; size: number; created: string }[]>([]);

  useEffect(() => {
    api.aiStatus().then(setOllama).catch(() => {});
    api.backupList().then(setBackups).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings, form]);

  const save = async (patch: Partial<SettingsType>) => {
    const next = { ...form!, ...patch };
    try {
      const saved = await api.updateSettings(next);
      applySettings(saved);
      setForm(saved);
      toast("Settings saved", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const exportBackup = async () => {
    try {
      const r = await api.backupExport();
      toast(`Backup created: ${r.filename}`, "success");
      api.backupList().then(setBackups);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const restoreBackup = async (filename: string) => {
    if (!window.confirm(`Restore "${filename}"? This replaces ALL current data.`)) return;
    try {
      await api.backupRestore(filename);
      toast("Backup restored — reload the app", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  if (!form) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-slate-400 mt-1">Everything lives on this machine. No accounts, no cloud.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4"><User size={16} className="text-accent-soft" /><h3 className="font-semibold">Profile</h3></div>
          <label className="text-xs text-slate-500 block mb-1.5">Display name</label>
          <Input value={form.profile_name} onChange={(e) => setForm({ ...form, profile_name: e.target.value })} onBlur={() => save({ profile_name: form.profile_name })} />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4"><Palette size={16} className="text-accent-soft" /><h3 className="font-semibold">Appearance</h3></div>
          <div className="grid grid-cols-3 gap-2">
            {[["dark", "🌙 Dark"], ["light", "☀️ Light"], ["high", "⬜ High contrast"]].map(([key, label]) => (
              <button key={key} onClick={() => save(key === "high" ? { theme: "dark", high_contrast: true } : { theme: key, high_contrast: false })}
                className={`rounded-xl py-2.5 text-sm font-medium transition ${form.theme === key || (key === "high" && form.high_contrast) ? "bg-accent/20 text-accent-soft border border-accent/30" : "bg-surface-700/50 hover:bg-surface-700 text-slate-400"}`}>
                {label}
              </button>
            ))}
          </div>
          <label className="text-xs text-slate-500 block mt-4 mb-2">Font size: {Math.round(form.font_scale * 100)}%</label>
          <input type="range" min={0.85} max={1.3} step={0.05} value={form.font_scale}
            onChange={(e) => setForm({ ...form, font_scale: Number(e.target.value) })}
            onMouseUp={() => save({ font_scale: form.font_scale })}
            className="w-full accent-[#6366f1]" />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4"><Timer size={16} className="text-accent-soft" /><h3 className="font-semibold">Goals & Pomodoro</h3></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "daily_goal_hours", label: "Daily goal (h)", step: 0.5 },
              { key: "weekly_goal_hours", label: "Weekly goal (h)", step: 1 },
              { key: "pomodoro_focus", label: "Focus (min)", step: 1 },
              { key: "pomodoro_break", label: "Break (min)", step: 1 },
              { key: "pomodoro_long_break", label: "Long break (min)", step: 1 },
            ].map(({ key, label, step }) => (
              <div key={key}>
                <label className="text-xs text-slate-500 block mb-1.5">{label}</label>
                <Input type="number" min={1} step={step} value={form[key as keyof SettingsType] as number}
                  onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                  onBlur={() => save({ [key]: Number(form[key as keyof SettingsType]) } as Partial<SettingsType>)} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4"><ShieldCheck size={16} className="text-accent-soft" /><h3 className="font-semibold">Local models</h3></div>
          {ollama && (
            <Badge color={ollama.ollama_available ? "#34d399" : "#fbbf24"}>
              {ollama.ollama_available ? "Local model ready" : "Local model not installed"}
            </Badge>
          )}
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Local model URL</label>
              <Input value={form.ollama_url} onChange={(e) => setForm({ ...form, ollama_url: e.target.value })} onBlur={() => save({ ollama_url: form.ollama_url })} />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1.5">Model</label>
              <Select value={form.ollama_model} onChange={(e) => save({ ollama_model: e.target.value })}>
                {["qwen2.5:7b", "gemma2:9b", "phi3:mini", "llama3.2:3b", "mistral:7b"].map((m) => (
                  <option key={m} value={m}>{m}{ollama?.installed_models?.includes(m) ? " ✓" : ""}</option>
                ))}
                {ollama?.installed_models?.filter((m) => !["qwen2.5:7b", "gemma2:9b", "phi3:mini", "llama3.2:3b", "mistral:7b"].includes(m)).map((m) => (
                  <option key={m} value={m}>{m} ✓</option>
                ))}
              </Select>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Install a local model runner (e.g. Ollama), then run <code className="font-mono text-accent-soft">ollama pull qwen2.5:7b</code>. Until then the Study Assistant uses its built-in engine — fully functional.
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4"><Database size={16} className="text-accent-soft" /><h3 className="font-semibold">Backup & restore</h3></div>
        <p className="text-sm text-slate-400 mb-4">Backups are AES-encrypted and stored locally in <code className="font-mono text-accent-soft">backend/data/backups/</code>.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={exportBackup}><Download size={15} /> Create backup</Button>
          <Button variant="ghost" onClick={() => { api.backupList().then(setBackups); }}>Refresh list</Button>
        </div>
        {backups.length > 0 && (
          <ul className="mt-4 space-y-2">
            {backups.map((b) => (
              <li key={b.filename} className="flex items-center justify-between gap-2 text-sm">
                <span className="font-mono text-xs text-slate-400">{b.filename}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500">{(b.size / 1024).toFixed(1)} KB · {new Date(b.created).toLocaleString()}</span>
                  <button onClick={() => restoreBackup(b.filename)} className="text-xs text-accent-soft hover:underline flex items-center gap-1"><Archive size={12} /> Restore</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3"><ShieldCheck size={16} className="text-emerald-400" /><h3 className="font-semibold">Your privacy</h3></div>
        <ul className="space-y-1.5 text-sm text-slate-400">
          <li>🔒 No account. No sign-up. No tracking.</li>
          <li>🏠 All data stays in SQLite on this device.</li>
          <li>🧠 The assistant runs locally on <code className="font-mono text-accent-soft">127.0.0.1</code> — nothing is uploaded.</li>
          <li>🗄️ Backups are encrypted before touching disk.</li>
          <li>📴 Fully usable offline, always.</li>
        </ul>
        <p className="text-xs text-slate-600 mt-4">StudyOS v0.1.0 · Local · Private · Free.</p>
      </Card>
    </div>
  );
}
