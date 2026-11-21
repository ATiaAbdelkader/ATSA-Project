export type OpticsTraceability = {
  objectiveMagnification: string;
  chamberDepthMicrons?: number;
};

export const EMPTY_OPTICS_TRACEABILITY: OpticsTraceability = {
  objectiveMagnification: "",
  chamberDepthMicrons: undefined,
};

export function formatOpticsMagnification(value?: string) {
  return value?.trim() || "not recorded";
}

export function formatChamberDepthMicrons(value?: number) {
  return Number.isFinite(value) && value && value > 0 ? `${value} µm` : "not recorded";
}
