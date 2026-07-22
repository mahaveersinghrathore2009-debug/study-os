import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, Flame, Gauge, Sparkles, Target, TrendingUp } from "lucide-react";
import type { DashboardData } from "../types";
import { api } from "../lib/api";
import { Badge, Card, ProgressBar, SectionTitle, Spinner, StatCard } from "../components/ui";
import { formatMinutes, pct } from "../lib/format";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.dashboard().then(setData).catch(() => setError(true));
  }, []);

  if (error) return <BackendDown />;
  if (!data) return <Spinner />;

  const todayPct = pct(data.today.minutes, data.today.goal_hours * 60);
  const weekPct = pct(data.week.minutes, data.week.goal_hours * 60);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{data.greeting_time} 👋</h1>
        <p className="text-slate-400 mt-1">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Flame size={22} />} label="Study Streak" value={`${data.streak} days`} sub="Keep it alive today" color="#fb923c" />
        <StatCard icon={<Gauge size={22} />} label="Productivity" value={`${data.productivity_score}/100`} sub="This week" color="#34d399" />
        <StatCard icon={<ClockIcon />} label="Studied today" value={formatMinutes(data.today.minutes)} sub={`${data.today.sessions} session${data.today.sessions === 1 ? "" : "s"}`} color="#22d3ee" />
        <StatCard icon={<TrendingUp size={22} />} label="This week" value={formatMinutes(data.week.minutes)} sub={`goal ${data.week.goal_hours}h`} color="#a78bfa" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle>Goals</SectionTitle>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Daily goal</span>
                <span className="font-medium">{formatMinutes(data.today.minutes)} / {data.today.goal_hours}h</span>
              </div>
              <ProgressBar value={todayPct} color="#22d3ee" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">Weekly goal</span>
                <span className="font-medium">{formatMinutes(data.week.minutes)} / {data.week.goal_hours}h</span>
              </div>
              <ProgressBar value={weekPct} color="#a78bfa" />
            </div>
            {data.goals.map((g) => (
              <div key={g.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-400">{g.title} <span className="text-slate-600">· {g.period}</span></span>
                  <span className="font-medium">{Math.round(g.progress * 100)}%</span>
                </div>
                <ProgressBar value={g.progress * 100} />
              </div>
            ))}
            {data.goals.length === 0 && (
              <p className="text-sm text-slate-500">
                No goals yet — <Link to="/goals" className="text-accent-soft hover:underline">create one</Link> to track progress.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle>Upcoming exams</SectionTitle>
          {data.upcoming_exams.length === 0 ? (
            <p className="text-sm text-slate-500">No exams in the next 14 days. Enjoy the calm. ☕</p>
          ) : (
            <ul className="space-y-3">
              {data.upcoming_exams.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.subject ?? "General"} · {e.date}</p>
                  </div>
                  <Badge color={e.days_left <= 3 ? "#f87171" : e.days_left <= 7 ? "#fbbf24" : "#34d399"}>
                    {e.days_left === 0 ? "Today!" : `${e.days_left}d`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle>Current subject</SectionTitle>
          {data.current_subject ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${data.current_subject.color}22`, color: data.current_subject.color }}>
                <BookOpen size={20} />
              </div>
              <div>
                <p className="font-semibold">{data.current_subject.name}</p>
                <p className="text-xs text-slate-500">Most studied this week</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Start a <Link to="/study" className="text-accent-soft hover:underline">study session</Link> to see your focus subject.</p>
          )}
        </Card>

        <Card className="lg:col-span-2 bg-gradient-to-br from-accent/15 to-transparent">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-accent/20 text-accent-soft">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">{data.recommendation.title}</p>
              <p className="text-sm text-slate-300 mt-1 leading-relaxed">{data.recommendation.text}</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">Generated locally from your study data.</p>
        </Card>
      </div>

      <Card className="text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <CalendarDays size={16} />
          <p className="italic">“{data.quote}”</p>
        </div>
      </Card>
    </div>
  );
}

function ClockIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

function BackendDown() {
  return (
    <div className="flex h-[70vh] flex-col items-center justify-center text-center">
      <div className="p-5 rounded-2xl bg-surface-600/40 mb-4"><Target size={40} className="text-slate-400" /></div>
      <h2 className="text-xl font-semibold">Backend not running</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm">
        Start the StudyOS local server with <code className="font-mono text-accent-soft">scripts/dev.sh</code> or
        <code className="font-mono text-accent-soft"> python -m uvicorn app.main:app --port 8000</code> from <code className="font-mono text-accent-soft">backend/</code>.
      </p>
    </div>
  );
}
