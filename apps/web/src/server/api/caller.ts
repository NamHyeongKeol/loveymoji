import { appRouter } from "./root";
import { createCaller, createInnerTRPCContext } from "./trpc";

export async function createServerCaller() {
  const ctx = createInnerTRPCContext();
  return createCaller(appRouter)(ctx);
}
