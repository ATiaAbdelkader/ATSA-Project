export function OutputFingerprint({ fingerprint }: { fingerprint: string }) {
  return <section className="output-fingerprint" aria-label="Deterministic output fingerprint"><div><p className="eyebrow">OUTPUT FINGERPRINT</p><h3>Browser-local reproducibility reference</h3><small>Deterministic checksum of compact technical output fields. It is not a cryptographic signature, tamper-proof record, diagnostic result, or biological interpretation.</small></div><code>{fingerprint}</code></section>;
}
