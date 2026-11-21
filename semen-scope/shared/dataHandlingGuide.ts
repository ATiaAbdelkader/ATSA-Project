export type DataHandlingGuideEntry = {
  title: string;
  detail: string;
};

export const DATA_HANDLING_GUIDE: DataHandlingGuideEntry[] = [
  { title: "Temporary workspace context", detail: "Specimen, optics, dose-planning, review-selection, and staged-footage context are held in the active browser workspace. Clear temporary local session removes this context." },
  { title: "Browser-local method draft", detail: "Species, calibration, and cut-offs can be saved, transferred, or cleared in this browser. Drafts exclude board evidence, footage, and analysis results." },
  { title: "Authenticated immutable record", detail: "When signed in, a completed analysis can save its metadata and trajectory JSON for review. Video bytes are not stored in the database." },
];
