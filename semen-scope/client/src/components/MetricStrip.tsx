import { roundMetric, type CasaSummary } from "@shared/casa";

const metrics: Array<{ label: string; key: keyof CasaSummary; unit: string; accent: string }> = [
  { label: "Tracked cells", key: "totalTrackedCells", unit: "cells", accent: "sea" },
  { label: "Total motility", key: "motility", unit: "%", accent: "violet" },
  { label: "Progressive", key: "progressiveMotility", unit: "%", accent: "gold" },
  { label: "VCL", key: "vcl", unit: "µm/s", accent: "sea" },
  { label: "VSL", key: "vsl", unit: "µm/s", accent: "violet" },
  { label: "VAP", key: "vap", unit: "µm/s", accent: "gold" },
];

export function MetricStrip({ summary }: { summary?: CasaSummary }) {
  return (
    <section className="metric-strip" aria-label="Core CASA-style summary measures">
      {metrics.map(metric => (
        <div className="metric-cell" key={metric.key}>
          <span className={`metric-dot ${metric.accent}`} />
          <p>{metric.label}</p>
          <div>
            <strong>{summary ? roundMetric(summary[metric.key] as number) : "—"}</strong>
            <small>{metric.unit}</small>
          </div>
        </div>
      ))}
    </section>
  );
}
