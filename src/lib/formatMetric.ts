import type { AnalysisProvenance } from '../types';

type MetricValue = number | null | undefined;

function fieldProvenance(provenance: AnalysisProvenance | undefined, field: string) {
  if (!provenance) return undefined;
  return provenance.fields[field] ?? provenance.fields[field.split('.')[0]];
}

export function isMetricUnavailable(provenance: AnalysisProvenance | undefined, field: string) {
  return fieldProvenance(provenance, field) === 'unavailable';
}

export function formatMetric(
  value: MetricValue,
  provenance: AnalysisProvenance | undefined,
  field: string,
  decimals = 1,
  unavailableLabel = 'N/A'
) {
  if (isMetricUnavailable(provenance, field) || typeof value !== 'number' || !Number.isFinite(value)) {
    return unavailableLabel;
  }
  return value.toFixed(decimals);
}

export function formatMetricCsv(
  value: MetricValue,
  field: string,
  provenance: AnalysisProvenance | undefined,
  decimals = 1
) {
  return formatMetric(value, provenance, field, decimals, 'N/A');
}

export function formatMetricWithUnit(
  value: MetricValue,
  provenance: AnalysisProvenance | undefined,
  field: string,
  unit: string,
  decimals = 1,
  unavailableLabel = 'N/A'
) {
  const formatted = formatMetric(value, provenance, field, decimals, unavailableLabel);
  return formatted === unavailableLabel ? formatted : `${formatted}${unit}`;
}
