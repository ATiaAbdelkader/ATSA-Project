import type { TrackDurationEvidence as Evidence } from "@shared/trackDurationEvidence";

export function TrackDurationEvidence({ evidence }: { evidence: Evidence }) {
  return <section className="track-duration-evidence" aria-label="Accepted track duration evidence"><div><p className="eyebrow">TRACK DURATION EVIDENCE</p><h3>Accepted-track observation span</h3><small>Transparent frame-count evidence only. These values describe accepted trajectories and do not change classifications, kinematics, or biological interpretation.</small></div><div className="track-duration-grid"><span><strong>{evidence.acceptedTracks}</strong> accepted tracks</span><span><strong>{evidence.meanFrames.toFixed(1)}</strong> mean frames</span><span><strong>{evidence.shortestFrames}</strong> shortest track</span><span><strong>{evidence.longestFrames}</strong> longest track</span></div></section>;
}
