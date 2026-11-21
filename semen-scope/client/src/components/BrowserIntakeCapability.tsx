import { Camera, CheckCircle2, CircleAlert, Clapperboard, Info, ScanLine, ShieldCheck } from "lucide-react";
import type { BrowserIntakeCapabilityEvidence } from "@shared/browserIntakeCapability";

export function BrowserIntakeCapability({ evidence }: { evidence: BrowserIntakeCapabilityEvidence }) {
  const capabilityIcon = (id: string) => id === "camera" ? <Camera size={13} /> : id === "recording" ? <Clapperboard size={13} /> : id === "canvas" ? <ScanLine size={13} /> : id === "secure-context" ? <ShieldCheck size={13} /> : <Info size={13} />;
  return <div className="browser-intake-capability" aria-label="Browser microscope intake capability">
    <div className="intake-capability-summary"><span><CheckCircle2 size={13} />{evidence.availableCount} available</span><span><CircleAlert size={13} />{evidence.reviewCount} review</span></div>
    <div className="intake-capability-list">{evidence.items.map(item => <div key={item.id} className={item.status}><i>{capabilityIcon(item.id)}</i><span><strong>{item.label}</strong><small>{item.note}</small></span></div>)}</div>
    <p className="intake-capability-note"><Info size={13} />{evidence.rationale}</p>
  </div>;
}
