import { connection } from "@crossval/db";
import { env } from "@crossval/env/server";

import { app } from "./app.js";

app.listen({ hostname: "0.0.0.0", port: env.PORT }, (server) => {
  console.log(`Server is running on http://${server.hostname}:${server.port}`);

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, async () => {
      try {
        await server.stop();
        await connection.close();
        process.exit(0);
      } catch (error) {
        console.error("Graceful shutdown failed", error);
        process.exit(1);
      }
    });
  }
});
