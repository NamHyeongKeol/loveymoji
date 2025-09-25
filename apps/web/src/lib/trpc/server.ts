import { cache } from "react";
import { createServerCaller } from "@/server/api/caller";

export const serverApi = {
  upload: {
    all: cache(async () => {
      const caller = await createServerCaller();
      return caller.upload.all();
    }),
  },
};
