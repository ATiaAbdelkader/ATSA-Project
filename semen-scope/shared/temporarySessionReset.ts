import { EMPTY_OPTICS_TRACEABILITY, type OpticsTraceability } from "./opticsTraceability";
import { EMPTY_DOSE_PLAN, EMPTY_SPECIMEN_CONTEXT, type DosePlanInput, type SpecimenContext } from "./specimenWorkflow";

export type TemporarySessionResetState = {
  specimenContext: SpecimenContext;
  opticsTraceability: OpticsTraceability;
  dosePlan: DosePlanInput;
};

export function createTemporarySessionResetState(): TemporarySessionResetState {
  return {
    specimenContext: { ...EMPTY_SPECIMEN_CONTEXT },
    opticsTraceability: { ...EMPTY_OPTICS_TRACEABILITY },
    dosePlan: { ...EMPTY_DOSE_PLAN },
  };
}
