import { DEFAULT_CASA_THRESHOLDS, type CasaCalibration, type CasaThresholds } from "./casa";

export const LOCAL_METHOD_DRAFT_STORAGE_KEY = "semenscope.browser-local-method-draft.v1";

export type LocalMethodDraft = {
  schema: "semenscope.browser-local-method-draft.v1";
  savedAt: string;
  species: string;
  calibration: CasaCalibration;
  thresholds: CasaThresholds;
};

export function createLocalMethodDraft({ species, calibration, thresholds, savedAt = new Date().toISOString() }: Omit<LocalMethodDraft, "schema" | "savedAt"> & { savedAt?: string }): LocalMethodDraft {
  return { schema: "semenscope.browser-local-method-draft.v1", savedAt, species, calibration: { ...calibration }, thresholds: { ...thresholds } };
}

export function parseLocalMethodDraft(value: string | null): LocalMethodDraft | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<LocalMethodDraft>;
    const thresholdValues = parsed.thresholds as Partial<CasaThresholds> | undefined;
    const hasValidThresholds = Boolean(thresholdValues) && Object.keys(DEFAULT_CASA_THRESHOLDS).every(key => Number.isFinite(thresholdValues?.[key as keyof CasaThresholds]));
    if (parsed.schema !== "semenscope.browser-local-method-draft.v1" || typeof parsed.species !== "string" || !parsed.calibration || !hasValidThresholds || typeof parsed.calibration.micronsPerPixel !== "number" || parsed.calibration.micronsPerPixel <= 0 || typeof parsed.calibration.frameRate !== "number" || parsed.calibration.frameRate <= 0) return undefined;
    return parsed as LocalMethodDraft;
  } catch {
    return undefined;
  }
}
