import { COOKIE_NAME } from "@shared/const";
import { analysisSnapshotSchema, labSettingsInputSchema } from "@shared/analysis-contract";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getLabSettings, listAnalysisRecords, saveAnalysisRecord, saveLabSettings } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  analysis: router({
    list: protectedProcedure.query(({ ctx }) => listAnalysisRecords(ctx.user.id)),
    save: protectedProcedure.input(analysisSnapshotSchema).mutation(async ({ ctx, input }) => {
      await saveAnalysisRecord({ ...input, ownerId: ctx.user.id, videoUrl: input.videoUrl ?? null });
      return { success: true } as const;
    }),
    settings: router({
      get: protectedProcedure.query(({ ctx }) => getLabSettings(ctx.user.id)),
      save: protectedProcedure.input(labSettingsInputSchema).mutation(async ({ ctx, input }) => {
        await saveLabSettings(ctx.user.id, input.settingsJson);
        return { success: true } as const;
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
