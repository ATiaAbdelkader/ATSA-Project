import { Eye, StepForward } from "lucide-react";
import { useEffect, useState } from "react";
import type { ProcessedTrack } from "@/lib/analysisProcessor";
import type { CasaCalibration } from "@shared/casa";
import { getTrajectoryAuditPoint } from "@shared/trajectoryAudit";

export function TrajectoryAudit({ track, calibration, onSeek }: { track: ProcessedTrack; calibration: CasaCalibration; onSeek: (frame: number) => void }) {
  const [pointIndex, setPointIndex] = useState(0);
  useEffect(() => setPointIndex(Math.max(0, track.points.length - 1)), [track.id, track.points.length]);
  const point = track.points[pointIndex];
  if (!point) return null;
  const detail = getTrajectoryAuditPoint(point, pointIndex, calibration);
  return <section className="trajectory-audit" aria-label={`Point-level audit for ${track.id}`}><div><p className="eyebrow">POINT-LEVEL AUDIT</p><h3><Eye size={15} />{track.id} · point {detail.index + 1} / {track.points.length}</h3></div><input aria-label="Selected trajectory point" type="range" min={0} max={Math.max(0, track.points.length - 1)} value={pointIndex} onChange={event => setPointIndex(Number(event.target.value))} /><div className="trajectory-audit-values"><span>Frame<strong>{detail.frame}</strong></span><span>Time<strong>{detail.timeSeconds.toFixed(3)} s</strong></span><span>X<strong>{detail.xPx.toFixed(1)} px · {detail.xMicrons.toFixed(1)} µm</strong></span><span>Y<strong>{detail.yPx.toFixed(1)} px · {detail.yMicrons.toFixed(1)} µm</strong></span></div><button onClick={() => onSeek(detail.frame)}><StepForward size={14} />Seek active video to this point</button><small>Read-only audit control. Seeking changes playback position only; it does not alter tracked coordinates or calculated estimates.</small></section>;
}
