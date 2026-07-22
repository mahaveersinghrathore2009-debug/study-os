import { useEffect, useRef } from "react";
import * as echarts from "echarts";

export type ChartOption = echarts.EChartsOption;

// Thin wrapper: dark-theme default styling + auto resize + disposal.
export default function Chart({ option, height = 280, className = "" }: { option: ChartOption; height?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;
    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} style={{ height }} className={className} />;
}

export const baseColors = ["#6366f1", "#22d3ee", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#f87171", "#60a5fa"];

export const tooltipStyle = {
  backgroundColor: "#1a2131",
  borderColor: "#232c40",
  textStyle: { color: "#e2e8f0", fontSize: 12 },
};

export const grid = { left: 8, right: 8, top: 30, bottom: 8, containLabel: true };

export function lineSeries(name: string, data: number[], color = "#6366f1", smooth = true) {
  return {
    name,
    type: "line" as const,
    data,
    smooth,
    symbol: "none",
    lineStyle: { width: 2.5, color },
    areaStyle: { opacity: 0.15, color },
    itemStyle: { color },
  };
}

export function barSeries(name: string, data: number[], color = "#6366f1") {
  return {
    name,
    type: "bar" as const,
    data,
    barWidth: "55%",
    itemStyle: { color, borderRadius: [6, 6, 0, 0] },
  };
}
