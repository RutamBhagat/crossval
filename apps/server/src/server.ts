import "@/validation-config";

import { serve } from "@hono/node-server";
import { connection } from "@crossval/db";
import { env } from "@crossval/env/server";

import app from "./index.js";

const server = serve(
  {
    fetch: app.fetch,
    hostname: env.HOST,
    port: env.PORT,
  },
  (info) => {
    console.log(`Server is running on http://${info.address}:${info.port}`);
  },
);

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; shutting down`);

  server.close(async (error) => {
    await connection.close();

    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
