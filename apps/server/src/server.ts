import { connection } from "@crossval/db";
import { env } from "@crossval/env/server";
import { serve } from "@hono/node-server";

import app from "./index.js";
import { redisClient } from "./redis.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

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

let shutdownStarted = false;

function forceShutdown(reason: string) {
  console.error(reason);
  if ("closeAllConnections" in server) {
    server.closeAllConnections();
  }
  process.exit(1);
}

function stopServer() {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function shutdown(signal: NodeJS.Signals) {
  if (shutdownStarted) {
    forceShutdown(`Received ${signal} during shutdown; forcing exit`);
  }

  shutdownStarted = true;
  console.log(`Received ${signal}; shutting down`);

  const timeout = setTimeout(
    () => forceShutdown("Graceful shutdown timed out; forcing exit"),
    SHUTDOWN_TIMEOUT_MS,
  );
  timeout.unref();

  let failed = false;

  try {
    await stopServer();
  } catch (error) {
    failed = true;
    console.error("Failed to close HTTP server", error);
  }

  try {
    await connection.close();
  } catch (error) {
    failed = true;
    console.error("Failed to close MongoDB connection", error);
  }

  try {
    await redisClient.quit();
  } catch (error) {
    failed = true;
    console.error("Failed to close Redis connection", error);
  } finally {
    clearTimeout(timeout);
  }

  if (failed) {
    process.exitCode = 1;
  } else {
    console.log("Graceful shutdown complete");
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
