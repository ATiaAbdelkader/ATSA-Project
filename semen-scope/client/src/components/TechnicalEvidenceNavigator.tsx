import { useEffect, useState } from "react";

const destinations = [
  { id: "analysis-confidence-evidence", label: "Association" },
  { id: "analysis-sampling-evidence", label: "Sampling" },
  { id: "analysis-trajectory-integrity-evidence", label: "Integrity" },
  { id: "analysis-field-evidence", label: "Field context" },
  { id: "analysis-detector-evidence", label: "Detector" },
  { id: "analysis-detector-load-evidence", label: "Detector load" },
  { id: "analysis-candidate-score-evidence", label: "Candidate scores" },
  { id: "analysis-reproducibility-evidence", label: "Reproducibility" },
];

export function TechnicalEvidenceNavigator({ resetKey }: { resetKey: unknown }) {
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  useEffect(() => setSelectedDestinationId(null), [resetKey]);

  const navigate = (id: string) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const destination = document.getElementById(id);
    destination?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    destination?.focus({ preventScroll: true });
    setSelectedDestinationId(destination ? id : null);
  };

  return <nav className="technical-evidence-navigator" aria-label="Technical evidence navigation"><div><p className="eyebrow">TECHNICAL EVIDENCE INDEX</p><small>Jump to current-run technical context. Navigation only; it does not change analysis output or biological interpretation.</small></div><div className="technical-evidence-nav-actions">{destinations.map(destination => <button key={destination.id} type="button" aria-current={selectedDestinationId === destination.id ? "location" : undefined} onClick={() => navigate(destination.id)}>{destination.label}</button>)}</div></nav>;
}
