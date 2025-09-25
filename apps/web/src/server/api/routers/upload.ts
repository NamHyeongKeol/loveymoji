import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const uploadRouter = router({
  all: publicProcedure.query(async ({ ctx }) => {
    const uploads = await ctx.prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return uploads;
  }),
  byId: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const upload = await ctx.prisma.upload.findUnique({
        where: { id: input.id },
      });
      return upload;
    }),
});
