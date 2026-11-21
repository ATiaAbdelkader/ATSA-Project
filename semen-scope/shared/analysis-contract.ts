import { z } from "zod";

export const analysisSnapshotSchema = z.object({
  sampleName: z.string().trim().min(1).max(160),
  species: z.string().trim().min(1).max(80),
  source: z.enum(["reference", "upload", "camera"]),
  videoFileName: z.string().trim().min(1).max(255),
  videoUrl: z.string().max(2048).nullable().optional(),
  videoMetadataJson: z.string().min(2).max(200_000),
  calibrationJson: z.string().min(2).max(80_000),
  thresholdsJson: z.string().min(2).max(80_000),
  metricsJson: z.string().min(2).max(200_000),
  tracksJson: z.string().min(2).max(1_200_000),
  qualityFlagsJson: z.string().min(2).max(200_000),
  status: z.enum(["complete", "review_required"]),
});

export const labSettingsInputSchema = z.object({
  settingsJson: z.string().min(2).max(80_000),
});

export type AnalysisSnapshotInput = z.infer<typeof analysisSnapshotSchema>;
