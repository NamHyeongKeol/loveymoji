import { initTRPC } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "@loveymoji/db";

export type TRPCContext = {
  prisma: typeof prisma;
};

export function createInnerTRPCContext(): TRPCContext {
  return { prisma };
}

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  void opts;
  return createInnerTRPCContext();
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCaller = t.createCallerFactory;
