import assert from 'node:assert/strict';
import { buildValidationReport, calculateCategoricalAgreement, calculateNumericAgreement } from '../src/services/validationService';

const categorical = calculateCategoricalAgreement([
  { id: '1', referenceLabel: 'progressive', predictedLabel: 'progressive' },
  { id: '2', referenceLabel: 'progressive', predictedLabel: 'non-progressive' },
  { id: '3', referenceLabel: 'immotile', predictedLabel: 'immotile' }
]);

assert.equal(categorical.total, 3);
assert.equal(categorical.exactAgreement, 2);
assert.equal(categorical.agreementRate, 2 / 3);
assert.equal(categorical.confusionMatrix.progressive['non-progressive'], 1);
assert.deepEqual(categorical.labels, ['immotile', 'non-progressive', 'progressive']);

const numeric = calculateNumericAgreement([
  { id: '1', referenceValue: 10, predictedValue: 12 },
  { id: '2', referenceValue: 20, predictedValue: 17 },
  { id: '3', referenceValue: Number.NaN, predictedValue: 99 }
]);

assert.equal(numeric.total, 3);
assert.equal(numeric.valid, 2);
assert.equal(numeric.meanAbsoluteError, 2.5);
assert.equal(numeric.medianAbsoluteError, 2.5);
assert.equal(numeric.maxAbsoluteError, 3);

const empty = buildValidationReport({ categorical: [], numeric: [] });
assert.equal(empty.categorical.agreementRate, null);
assert.equal(empty.numeric.meanAbsoluteError, null);
assert.equal(empty.numeric.medianAbsoluteError, null);
assert.equal(empty.numeric.maxAbsoluteError, null);
assert.match(empty.notes[1], /clinical validity/i);

console.log('Validation workflow regression tests passed.');
