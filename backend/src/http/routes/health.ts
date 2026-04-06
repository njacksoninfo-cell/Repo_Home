import type { FastifyInstance } from "fastify";
import { getRedis } from "../../redis/redisClient";
import { getPool } from "../../db/pgClient";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async (_req, reply) => {
    const checks: Record<string, "ok" | "error"> = {};

    // Redis
    try {
      await getRedis().ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }

    // Postgres
    try {
      await getPool().query("SELECT 1");
      checks.postgres = "ok";
    } catch {
      checks.postgres = "error";
    }

    const allOk = Object.values(checks).every((v) => v === "ok");
    return reply.status(allOk ? 200 : 503).send({ status: allOk ? "ok" : "degraded", checks });
  });
}
