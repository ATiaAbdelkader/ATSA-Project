import type { TemporalSamplingEvidence as Evidence } from "@shared/temporalSampling";

export function TemporalSamplingEvidence({ evidence }: { evidence: Evidence }) {
  return <section className="temporal-sampling-evidence" aria-label="Temporal sampling evidence"><div><p className="eyebrow">TEMPORAL SAMPLING EVIDENCE</p><h3>Processed-frame coverage</h3><small>Technical processing evidence only. Frame sampling is recorded here and does not alter the underlying capture or create an additional assay.</small></div><div className="temporal-sampling-grid"><span><strong>{evidence.processedFrames}</strong> processed frames</span><span><strong>{evidence.availableFrames}</strong> available frames</span><span><strong>{evidence.processedPercent.toFixed(0)}%</strong> frame coverage</span><span><strong>{evidence.samplingIntervalSeconds.toFixed(3)} s</strong> sampling interval</span></div><p className="temporal-sampling-rationale">{evidence.rationale}</p></section>;
}
