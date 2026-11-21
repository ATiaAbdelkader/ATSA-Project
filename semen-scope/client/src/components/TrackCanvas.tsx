import type { CasaPoint } from "@shared/casa";
import type { ProcessedTrack } from "@/lib/analysisProcessor";

export function TrackCanvas({
  tracks,
  candidates = [],
  selectedTrackId,
  onSelectTrack,
  trailLength = 12,
  width,
  height,
  mode,
}: {
  tracks: Array<Pick<ProcessedTrack, "id" | "points" | "color">>;
  candidates?: Array<Pick<CasaPoint, "x" | "y">>;
  selectedTrackId?: string | null;
  onSelectTrack?: (trackId: string) => void;
  trailLength?: number;
  width: number;
  height: number;
  mode: "overlay" | "map";
}) {
  if ((!tracks.length && !candidates.length) || !width || !height) return null;
  const viewBox = `0 0 ${width} ${height}`;
  return (
    <svg className={mode === "overlay" ? "track-overlay" : "trajectory-map"} viewBox={viewBox} preserveAspectRatio="none" aria-label="Tracked sperm trajectories">
      {mode === "map" && <rect width={width} height={height} fill="#102320" rx="10" />}
      {tracks.slice(0, 80).map(track => {
        const visiblePoints = mode === "overlay" ? track.points.slice(-Math.max(2, trailLength)) : track.points;
        const points = visiblePoints.map(point => `${point.x},${point.y}`).join(" ");
        const first = visiblePoints[0];
        const last = visiblePoints.at(-1)!;
        const selected = track.id === selectedTrackId;
        const interactive = mode === "overlay" && Boolean(onSelectTrack);
        return (
          <g key={track.id} className={interactive ? "selectable-track" : undefined} role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined} aria-label={interactive ? `Inspect trajectory ${track.id}` : undefined} onClick={interactive ? () => onSelectTrack?.(track.id) : undefined} onKeyDown={interactive ? event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectTrack?.(track.id); } } : undefined}>
            {interactive && <polyline points={points} fill="none" stroke="transparent" strokeWidth={Math.max(12, width / 32)} strokeLinecap="round" strokeLinejoin="round" />}
            {selected && <polyline points={points} fill="none" stroke="#ffffff" strokeWidth={Math.max(5, width / 155)} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />}
            <polyline points={points} fill="none" stroke={track.color} strokeWidth={selected ? Math.max(3, width / 275) : Math.max(1.5, width / 480)} strokeLinecap="round" strokeLinejoin="round" opacity={selected ? 1 : "0.92"} />
            <circle cx={first.x} cy={first.y} r={Math.max(2.5, width / 240)} fill="#ffffff" opacity="0.85" />
            <circle cx={last.x} cy={last.y} r={selected ? Math.max(4.2, width / 170) : Math.max(2.5, width / 240)} fill={track.color} />
          </g>
        );
      })}
      {mode === "overlay" && candidates.map((candidate, index) => <circle key={`candidate-${index}`} className="live-candidate" cx={candidate.x} cy={candidate.y} r={Math.max(1.7, width / 340)} fill="none" stroke="#f4df78" strokeWidth={Math.max(1, width / 900)} opacity="0.88" />)}
    </svg>
  );
}
