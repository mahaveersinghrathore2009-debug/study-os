import { useEffect, useState } from "react";
import { Flame, Gauge, HeartPulse, Timer } from "lucide-react";
import type { AnalyticsOverview } from "../types";
import { api } from "../lib/api";
import Chart, { barSeries, grid, lineSeries, tooltipStyle } from "../components/Chart";
import { Badge, Card, ProgressBar, SectionTitle, Spinner, StatCard } from "../components/ui";
import { formatMinutes } from "../lib/format";

const HEAT_COLORS = ["#1a2131", "#312e81", "#4338ca", "#6366f1", "#818cf8"];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    api.analytics().then(setData).catch(() => {});
  }, []);

  if (!data) return <Spinner />;

  const axisStyle = { axisLabel: { color: "#64748b" }, splitLine: { lineStyle: { color: "#1e293b" } } };
  const burnoutColor = data.burnout_index.risk >= 66 ? "#f87171" : data.burnout_index.risk >= 33 ? "#fbbf24" : "#34d399";
  const total = data.daily.minutes.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-slate-400 mt-1">Your study patterns, visualized — computed entirely on this device.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Flame size={22} />} label="Streak" value={`${data.streak} days`} color="#fb923c" />
        <StatCard icon={<Gauge size={22} />} label="Productivity" value={`${data.productivity_score}/100`} color="#34d399" />
        <StatCard icon={<Timer size={22} />} label="Last 30 days" value={formatMinutes(total)} color="#22d3ee" />
        <StatCard icon={<HeartPulse size={22} />} label="Burnout risk" value={`${data.burnout_index.risk}/100`} sub={data.burnout_index.level} color={burnoutColor} />
      </div>

      <Card>
        <SectionTitle sub="Last 26 weeks — each cell is a day">Study heatmap</SectionTitle>
        <Heatmap cells={data.heatmap} />
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500">
          <span>Less</span>
          {HEAT_COLORS.map((c) => <span key={c} className="h-3 w-3 rounded-sm" style={{ backgroundColor: c }} />)}
          <span>More</span>
          <span className="ml-4">{formatMinutes(data.heatmap.reduce((a, c) => a + c.minutes, 0))} studied in the window</span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="Minutes per day, last 30 days">Daily study</SectionTitle>
          <Chart height={240} option={{
            tooltip: { trigger: "axis", ...tooltipStyle },
            grid,
            xAxis: { type: "category", data: data.daily.dates.map((d) => d.slice(5)), ...axisStyle },
            yAxis: { type: "value", ...axisStyle },
            series: [lineSeries("minutes", data.daily.minutes, "#22d3ee")],
          }} />
        </Card>

        <Card>
          <SectionTitle sub="Minutes per week, last 12 weeks">Weekly progress</SectionTitle>
          <Chart height={240} option={{
            tooltip: { trigger: "axis", ...tooltipStyle },
            grid,
            xAxis: { type: "category", data: data.weekly.labels.map((d) => d.slice(5)), ...axisStyle },
            yAxis: { type: "value", ...axisStyle },
            series: [barSeries("minutes", data.weekly.minutes, "#a78bfa")],
          }} />
        </Card>

        <Card>
          <SectionTitle sub="Minutes per month, last 6 months">Monthly growth</SectionTitle>
          <Chart height={240} option={{
            tooltip: { trigger: "axis", ...tooltipStyle },
            grid,
            xAxis: { type: "category", data: data.monthly.labels, ...axisStyle },
            yAxis: { type: "value", ...axisStyle },
            series: [lineSeries("minutes", data.monthly.minutes, "#34d399")],
          }} />
        </Card>

        <Card>
          <SectionTitle sub="Where your time goes">Subject distribution</SectionTitle>
          <Chart height={240} option={{
            tooltip: { trigger: "item", ...tooltipStyle },
            legend: { bottom: 0, textStyle: { color: "#64748b" }, type: "scroll" },
            series: [{
              type: "pie",
              radius: ["42%", "70%"],
              center: ["50%", "45%"],
              itemStyle: { borderRadius: 8, borderColor: "#121722", borderWidth: 2 },
              label: { show: false },
              data: data.subject_distribution.length ? data.subject_distribution.map((s) => ({ name: s.name, value: s.minutes, itemStyle: { color: s.color } }))
                : [{ name: "No data", value: 1, itemStyle: { color: "#1e293b" } }],
            }],
          }} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="Are you becoming more efficient over time?">Learning curve</SectionTitle>
          <Chart height={250} option={{
            tooltip: { trigger: "axis", ...tooltipStyle },
            legend: { textStyle: { color: "#64748b" }, top: 0 },
            grid,
            xAxis: { type: "category", data: data.learning_curve.labels, ...axisStyle },
            yAxis: [
              { type: "value", name: "min/session", nameTextStyle: { color: "#64748b" }, ...axisStyle },
              { type: "value", name: "days/week", nameTextStyle: { color: "#64748b" }, splitLine: { show: false } },
            ],
            series: [
              lineSeries("avg session (min)", data.learning_curve.avg_length_min, "#a78bfa"),
              { ...lineSeries("days studied / week", data.learning_curve.sessions_per_day, "#22d3ee"), yAxisIndex: 1 },
            ],
          }} />
        </Card>

        <Card>
          <SectionTitle sub="Productivity score by week (0-100)">Productivity trend</SectionTitle>
          <Chart height={250} option={{
            tooltip: { trigger: "axis", ...tooltipStyle },
            grid,
            xAxis: { type: "category", data: data.productivity_trend.labels, ...axisStyle },
            yAxis: { type: "value", min: 0, max: 100, ...axisStyle },
            series: [{
              ...lineSeries("score", data.productivity_trend.scores, "#34d399"),
              markLine: { silent: true, data: [{ yAxis: 60 }], lineStyle: { color: "#fbbf24", type: "dashed" }, label: { color: "#fbbf24", formatter: "target" } },
            }],
          }} />
        </Card>
      </div>

      <Card>
        <SectionTitle sub="Daily burnout risk score from study load and mood">Burnout trend</SectionTitle>
        <Chart height={220} option={{
          tooltip: { trigger: "axis", ...tooltipStyle },
          grid,
          xAxis: { type: "category", data: data.burnout_trend.map((b) => b.date.slice(5)), ...axisStyle },
          yAxis: { type: "value", min: 0, max: 100, ...axisStyle },
          series: [{
            type: "line", data: data.burnout_trend.map((b) => b.risk), smooth: true, symbol: "none",
            lineStyle: { width: 2.5, color: burnoutColor },
            areaStyle: { opacity: 0.2, color: burnoutColor },
            markLine: { silent: true, data: [{ yAxis: 66 }, { yAxis: 33 }], lineStyle: { color: "#475569", type: "dashed" } },
          }],
        }} />
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
          <Badge color={burnoutColor}>Risk: {data.burnout_index.risk}/100 · {data.burnout_index.level}</Badge>
          <span className="text-slate-400">{data.burnout_index.tip}</span>
        </div>
        {data.burnout_index.reasons.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {data.burnout_index.reasons.map((r, i) => <li key={i}>• {r}</li>)}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle sub="Estimated readiness from recent study in each subject">Exam readiness</SectionTitle>
          {data.exam_readiness.length === 0 ? (
            <p className="text-sm text-slate-500">Add exams in the Calendar to see your readiness forecast.</p>
          ) : (
            <div className="space-y-4">
              {data.exam_readiness.map((e) => (
                <div key={e.exam_id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{e.title} <span className="text-slate-500">· {e.subject ?? "General"}</span></span>
                    <span className={`font-bold ${e.readiness >= 80 ? "text-emerald-400" : e.readiness >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                      {e.readiness}%
                    </span>
                  </div>
                  <ProgressBar value={e.readiness} color={e.readiness >= 80 ? "#34d399" : e.readiness >= 50 ? "#fbbf24" : "#f87171"} />
                  <p className="text-xs text-slate-500 mt-1">
                    {e.days_left} days left · need ~{e.hours_needed}h total · pace {e.pace_hours_per_week}h/week · studied {e.hours_studied}h
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle sub="Detected from mastery, time, difficulty, mood and recency">Weak topics</SectionTitle>
          {data.weak_topics.length === 0 ? (
            <p className="text-sm text-slate-500">No weak topics detected yet. Add topics to subjects and log sessions to find patterns.</p>
          ) : (
            <ul className="space-y-3">
              {data.weak_topics.map((w) => (
                <li key={w.topic_id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{w.topic}</p>
                    <p className="text-xs text-slate-500">{w.subject} · mastery {Math.round(w.mastery * 100)}% · {formatMinutes(w.minutes)} studied</p>
                    <p className="text-xs text-rose-300/80 mt-0.5">{w.reasons.join(" · ")}</p>
                  </div>
                  <Badge color="#f87171">score {w.score.toFixed(2)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Heatmap({ cells }: { cells: { date: string; minutes: number; level: number }[] }) {
  const weeks: { date: string; level: number; minutes: number }[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    while (week.length < 7) week.push({ date: "", level: 0, minutes: 0 });
    weeks.push(week);
  }
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((c, di) => (
              <div key={di} title={c.date ? `${c.date}: ${c.minutes} min` : ""}
                className="h-3 w-3 rounded-[3px] transition hover:scale-125"
                style={{ backgroundColor: c.date ? HEAT_COLORS[c.level] : "transparent" }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
