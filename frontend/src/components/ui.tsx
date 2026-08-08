import { X } from "lucide-react";
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ children, className = "", ...rest }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{children}</h2>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

type BtnVariant = "primary" | "ghost" | "danger" | "soft";
export function Button({ variant = "primary", className = "", children, ...rest }: { variant?: BtnVariant } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<BtnVariant, string> = {
    primary: "bg-accent hover:bg-accent-deep text-white shadow-lg shadow-accent/20",
    ghost: "bg-surface-600/60 hover:bg-surface-600 text-slate-200",
    danger: "bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30",
    soft: "bg-accent/10 hover:bg-accent/20 text-accent-soft border border-accent/20",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl bg-surface-700/70 border border-surface-600 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition ${className}`}
      {...rest}
    />
  );
}

export function TextArea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-xl bg-surface-700/70 border border-surface-600 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition resize-none ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl bg-surface-700/70 border border-surface-600 px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent/60 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Badge({ children, color = "#6366f1" }: { children: ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, color = "#6366f1", className = "" }: { value: number; color?: string; className?: string }) {
  return (
    <div className={`h-2 w-full rounded-full bg-surface-600/50 overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
      />
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-600/60 text-slate-400">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 p-4 rounded-2xl bg-surface-600/40 text-slate-400">{icon}</div>
      <p className="font-medium text-slate-300">{title}</p>
      {sub && <p className="text-sm text-slate-500 mt-1 max-w-xs">{sub}</p>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-8 w-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
    </div>
  );
}

export function StatCard({ icon, label, value, sub, color = "#6366f1" }: { icon: ReactNode; label: string; value: ReactNode; sub?: string; color?: string }) {
  return (
    <Card className="flex items-start gap-4">
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}
