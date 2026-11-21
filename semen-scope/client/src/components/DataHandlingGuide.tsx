import { Database, Info, MonitorSmartphone, Save } from "lucide-react";
import { DATA_HANDLING_GUIDE } from "@shared/dataHandlingGuide";
import "./DataHandlingGuide.css";

const icons = [MonitorSmartphone, Save, Database];

export function DataHandlingGuide() {
  return <details className="data-handling-guide"><summary><Info size={14} /><span>Browser-local data handling</span></summary><div className="data-handling-guide-body">{DATA_HANDLING_GUIDE.map((entry, index) => { const Icon = icons[index]; return <div key={entry.title}><Icon size={14} /><span><strong>{entry.title}</strong><small>{entry.detail}</small></span></div>; })}</div></details>;
}
