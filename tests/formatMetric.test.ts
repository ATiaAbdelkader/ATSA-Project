import assert from 'node:assert/strict';
import type { AnalysisProvenance } from '../src/types';
import { formatMetric, formatMetricCsv, formatMetricWithUnit, isMetricUnavailable } from '../src/lib/formatMetric';

const unavailable: AnalysisProvenance = {
  overall: 'visualization-only',
  fields: {
    concentration: 'unavailable',
    vitality: 'unavailable',
    sdf: 'unavailable',
    morphology: 'unavailable',
    'kinematics.avgVcl': 'unavailable'
  },
  notes: ['Values are not validated measurements.']
};

const available: AnalysisProvenance = {
  overall: 'ai-estimated',
  fields: {
    concentration: 'ai-estimated',
    'kinematics.avgVcl': 'derived',
    'vitality.live': 'measured'
  },
  notes: []
};

assert.equal(isMetricUnavailable(unavailable, 'vitality.live'), true, 'base-field provenance should cover nested vitality metrics');
assert.equal(isMetricUnavailable(unavailable, 'kinematics.avgVcl'), true, 'exact nested provenance should be respected');
assert.equal(formatMetric(0, unavailable, 'concentration', 2), 'N/A', 'unavailable zero must not be rendered as a measurement');
assert.equal(formatMetricWithUnit(0, unavailable, 'sdf.dfi', '% DFI', 1, 'Not measured'), 'Not measured', 'unavailable unit values should omit the unit');
assert.equal(formatMetricCsv(0, 'morphology.normal', unavailable, 2), 'N/A', 'CSV unavailable values must use N/A');
assert.equal(formatMetric(42.345, available, 'concentration', 1), '42.3', 'available values should preserve requested decimal formatting');
assert.equal(formatMetricWithUnit(12.5, available, 'kinematics.avgVcl', ' µm/s', 1), '12.5 µm/s', 'available values should include units');
assert.equal(formatMetric(0, available, 'vitality.live', 1), '0.0', 'measured zero is a valid formatted value');
assert.equal(formatMetric(Number.NaN, available, 'concentration', 1), 'N/A', 'non-finite values must not be presented as measurements');

console.log('Metric formatting regression tests passed.');
