import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import http from "http";
import { config } from "./config";
import { healthRoutes } from "./http/routes/health";
import { sessionRoutes } from "./http/routes/session";
import { tokenRoutes } from "./http/routes/token";
import { profileRoutes } from "./http/routes/profile";
import { socialRoutes } from "./http/routes/social";
import { attachWebSocketServer } from "./ws/wsServer";
import { startEvictionJob } from "./jobs/staleDriverEviction";

async function main() {
  const app = Fastify({ logger: config.nodeEnv === "development" });

  await app.register(cors, { origin: "*" });
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowMs,
  });

  // HTTP routes
  await app.register(healthRoutes);
  await app.register(sessionRoutes);
  await app.register(tokenRoutes);
  await app.register(profileRoutes);
  await app.register(socialRoutes);

  // Build the underlying Node http.Server so we can attach WS
  await app.ready();
  const server = app.server as http.Server;

  // Attach WebSocket server on the same port at /ws
  attachWebSocketServer(server);

  // Start background jobs
  startEvictionJob();

  await app.listen({ port: config.port, host: "0.0.0.0" });
  console.log(`[Server] listening on port ${config.port}`);
}

main().catch((err) => {
  console.error("[Server] fatal:", err);
  process.exit(1);
});
