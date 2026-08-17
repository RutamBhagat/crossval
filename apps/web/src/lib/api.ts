import { treaty } from "@elysiajs/eden";

import type { App } from "@crossval/server/app";

const api = treaty<App>(
  typeof window === "undefined" ? "http://localhost:3000" : window.location.origin,
  {
    fetch: {
      credentials: "include",
    },
    throwHttpError: true,
  },
);

export { api };
