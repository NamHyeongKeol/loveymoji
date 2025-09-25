import { uploadRouter } from "./routers/upload";
import { router } from "./trpc";

export const appRouter = router({
  upload: uploadRouter,
});

export type AppRouter = typeof appRouter;
