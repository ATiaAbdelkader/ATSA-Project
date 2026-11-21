import type { TrackMetricRange, TrackMetricRangeEvidence } from "@shared/trackMetricRangeEvidence";

function RangeRow({ label, unit, range, digits }: { label: string; unit: string; range: TrackMetricRange; digits: number }) {
  return <div className="track-metric-range-row"><div><strong>{label}</strong><small>{unit}</small></div><span>{range.minimum.toFixed(digits)} min</span><span>{range.median.toFixed(digits)} median</span><span>{range.maximum.toFixed(digits)} max</span><span>{range.outlierTrackIds.length} candidate{range.outlierTrackIds.length === 1 ? "" : "s"}</span></div>;
}

export function TrackMetricRangeEvidence({ evidence }: { evidence: TrackMetricRangeEvidence }) {
  return <section className="track-metric-range-evidence" aria-label="Per-track metric range evidence"><div><p className="eyebrow">METRIC-RANGE EVIDENCE</p><h3>Accepted-track numerical spread</h3><small>Read-only technical review context across {evidence.acceptedTracks} accepted tracks. Candidate IDs use Tukey 1.5×IQR fences only; they do not remove, reclassify, or biologically interpret trajectories.</small></div><div className="track-metric-range-grid"><RangeRow label="VCL" unit="µm/s" range={evidence.vcl} digits={1} /><RangeRow label="LIN" unit="%" range={evidence.lin} digits={1} /><RangeRow label="Association confidence" unit="0–1" range={evidence.confidence} digits={3} /></div></section>;
}
