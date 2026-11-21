import type { CasaTrackMetrics } from "./casa";

export type ClassificationComposition = {
  total: number;
  progressive: number;
  motileNonProgressive: number;
  nonMotile: number;
};

export function buildClassificationComposition(metrics: CasaTrackMetrics[]): ClassificationComposition {
  const progressive = metrics.filter(metric => metric.progressive).length;
  const motileNonProgressive = metrics.filter(metric => metric.motile && !metric.progressive).length;
  return { total: metrics.length, progressive, motileNonProgressive, nonMotile: metrics.length - progressive - motileNonProgressive };
}
