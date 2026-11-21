import type { CasaCalibration, CasaThresholds } from "./casa";

const METHOD_SCHEMA = "semenscope-browser-casa-v1";

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function speciesCode(species: string) {
  const letters = species.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters.slice(0, 3) || "GEN").padEnd(3, "X");
}

export function createMethodFingerprint({ species, calibration, thresholds }: { species: string; calibration: CasaCalibration; thresholds: CasaThresholds }) {
  const orderedThresholds = Object.keys(thresholds).sort().map(key => [key, thresholds[key as keyof CasaThresholds]]);
  const payload = JSON.stringify({ schema: METHOD_SCHEMA, species, calibration, thresholds: orderedThresholds });
  return `SS-${speciesCode(species)}-${fnv1a(payload)}`;
}

export { METHOD_SCHEMA };
