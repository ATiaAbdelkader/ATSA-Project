import type {
  CategoricalValidationPair,
  NumericValidationPair,
  ValidationReport
} from '../types';

function finiteValues(values: number[]) {
  return values.filter((value) => Number.isFinite(value));
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function calculateCategoricalAgreement(pairs: CategoricalValidationPair[]) {
  const labels = [...new Set(pairs.flatMap((pair) => [pair.referenceLabel, pair.predictedLabel]))].sort();
  const confusionMatrix = Object.fromEntries(
    labels.map((referenceLabel) => [
      referenceLabel,
      Object.fromEntries(labels.map((predictedLabel) => [predictedLabel, 0]))
    ])
  ) as Record<string, Record<string, number>>;

  for (const pair of pairs) {
    confusionMatrix[pair.referenceLabel] ??= {};
    confusionMatrix[pair.referenceLabel][pair.predictedLabel] =
      (confusionMatrix[pair.referenceLabel][pair.predictedLabel] ?? 0) + 1;
  }

  const exactAgreement = pairs.filter((pair) => pair.referenceLabel === pair.predictedLabel).length;
  return {
    total: pairs.length,
    exactAgreement,
    agreementRate: pairs.length ? exactAgreement / pairs.length : null,
    labels,
    confusionMatrix
  };
}

export function calculateNumericAgreement(pairs: NumericValidationPair[]) {
  const validPairs = pairs.filter((pair) => Number.isFinite(pair.referenceValue) && Number.isFinite(pair.predictedValue));
  const absoluteErrors = validPairs.map((pair) => Math.abs(pair.referenceValue - pair.predictedValue));
  const finiteErrors = finiteValues(absoluteErrors);

  return {
    total: pairs.length,
    valid: validPairs.length,
    meanAbsoluteError: finiteErrors.length
      ? finiteErrors.reduce((sum, error) => sum + error, 0) / finiteErrors.length
      : null,
    medianAbsoluteError: median(finiteErrors),
    maxAbsoluteError: finiteErrors.length ? Math.max(...finiteErrors) : null
  };
}

export function buildValidationReport(input: {
  categorical: CategoricalValidationPair[];
  numeric: NumericValidationPair[];
}): ValidationReport {
  return {
    categorical: calculateCategoricalAgreement(input.categorical),
    numeric: calculateNumericAgreement(input.numeric),
    notes: [
      'Metrics compare AI outputs with human reference annotations supplied by an authorized reviewer.',
      'Agreement metrics do not establish clinical validity or diagnostic performance.'
    ]
  };
}
