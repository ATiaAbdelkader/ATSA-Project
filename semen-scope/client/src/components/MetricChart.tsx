import { roundMetric, type CasaSummary } from "@shared/casa";

const chartMetrics: Array<{ label: string; key: keyof Pick<CasaSummary, "vcl" | "vsl" | "vap" | "lin" | "str" | "wob" | "alh" | "bcf" | "dance" | "mad" | "alhMax" | "fractalDimension" | "meanConfidence">; unit: string; color: string }> = [
  { label: "VCL", key: "vcl", unit: "µm/s", color: "#4fc8ae" },
  { label: "VSL", key: "vsl", unit: "µm/s", color: "#a78bfa" },
  { label: "VAP", key: "vap", unit: "µm/s", color: "#f5bf66" },
  { label: "LIN", key: "lin", unit: "%", color: "#69b9f5" },
  { label: "STR", key: "str", unit: "%", color: "#e987a9" },
  { label: "WOB", key: "wob", unit: "%", color: "#78d8c1" },
  { label: "ALH", key: "alh", unit: "µm", color: "#b5a4ff" },
  { label: "BCF", key: "bcf", unit: "Hz", color: "#f3cf79" },
  { label: "DANCE", key: "dance", unit: "µm²/s", color: "#80b7f6" },
  { label: "MAD", key: "mad", unit: "°", color: "#f0a3bd" },
  { label: "ALH max", key: "alhMax", unit: "µm", color: "#c4a4f3" },
  { label: "Path FD", key: "fractalDimension", unit: "index", color: "#72bfcf" },
  { label: "Link confidence", key: "meanConfidence", unit: "0–1", color: "#e6bd70" },
];

export function MetricChart({ summary }: { summary?: CasaSummary }) {
  const values = summary ? chartMetrics.map(metric => Number(summary[metric.key])) : [];
  const maximum = Math.max(...values, 1);
  return (
    <div className="metric-chart" aria-label="Extended CASA-style metric chart">
      {chartMetrics.map(metric => {
        const value = summary ? Number(summary[metric.key]) : 0;
        return (
          <div className="chart-row" key={metric.key}>
            <div className="chart-label"><span>{metric.label}</span><small>{metric.unit}</small></div>
            <div className="chart-track"><div className="chart-fill" style={{ width: `${summary ? Math.max(3, (value / maximum) * 100) : 0}%`, background: metric.color }} /></div>
            <strong>{summary ? roundMetric(value) : "—"}</strong>
          </div>
        );
      })}
    </div>
  );
}
