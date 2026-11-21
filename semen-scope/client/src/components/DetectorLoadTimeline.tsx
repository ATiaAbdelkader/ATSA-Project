import type { DetectorLoadTimeline as DetectorLoadTimelineType } from "@shared/detectorLoadTimeline";

function makePath(points: DetectorLoadTimelineType["points"], peak: number) {
  if (!points.length) return "";
  const denominator = Math.max(1, points.length - 1);
  const height = Math.max(1, peak);
  return points.map((point, index) => `${(index / denominator) * 100},${30 - (point.candidateCount / height) * 26}`).join(" ");
}

export function DetectorLoadTimeline({ evidence }: { evidence: DetectorLoadTimelineType }) {
  const path = makePath(evidence.points, evidence.peakCandidates);
  return <section className="detector-load-timeline" aria-label="Detector load timeline"><div><p className="eyebrow">DETECTOR LOAD TIMELINE</p><h3>Sampled candidate counts</h3><small>Chronological detector workload context only. The timeline does not change candidates, trajectories, metrics, classifications, or biological interpretation.</small></div><div className="detector-load-timeline-summary"><span><strong>{evidence.sampledFrames}</strong> samples</span><span><strong>{evidence.peakCandidates}</strong> peak candidates</span><span><strong>{evidence.peakFrame ?? "—"}</strong> peak frame</span><span><strong>{evidence.capBoundSamples}</strong> cap-bound samples</span></div><div className="detector-load-chart-wrap"><svg className="detector-load-chart" viewBox="0 0 100 32" preserveAspectRatio="none" role="img" aria-label={`${evidence.sampledFrames} sampled detector counts; peak ${evidence.peakCandidates} candidates at frame ${evidence.peakFrame ?? "not recorded"}`}><line x1="0" y1="30" x2="100" y2="30" /><polyline points={path} /></svg></div><p className="detector-load-timeline-rationale">{evidence.rationale}</p></section>;
}
