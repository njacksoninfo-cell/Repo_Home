import type { FastifyInstance } from "fastify";
import { getSession } from "../../session/sessionStore";
import { getRecentEncounters } from "../../social/encounterTracker";
import { getRegulars } from "../../social/regularEngine";
import { sendWave, getConnections } from "../../social/waveService";
import { getSessionFields } from "../../redis/redisClient";
import type { VehicleProfile } from "@proximity/shared";

async function resolveVehicle(sessionId: string): Promise<VehicleProfile | null> {
  const fields = await getSessionFields(sessionId);
  if (!fields?.vehicle) return null;
  try {
    return JSON.parse(fields.vehicle) as VehicleProfile;
  } catch {
    return null;
  }
}

export async function socialRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/convoy/recent — post-drive history
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/convoy/recent",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      const encounters = await getRecentEncounters(sessionId);
      const enriched = await Promise.all(
        encounters.map(async (e) => ({
          ...e,
          vehicle: await resolveVehicle(e.encounteredId),
        }))
      );
      return reply.send({ encounters: enriched });
    }
  );

  // GET /api/regulars — frequent co-drivers
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/regulars",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      const regulars = await getRegulars(sessionId);
      const enriched = await Promise.all(
        regulars.map(async (r) => ({
          ...r,
          vehicle: await resolveVehicle(r.encounteredId),
        }))
      );
      return reply.send({ regulars: enriched });
    }
  );

  // POST /api/wave — send a wave to another session
  app.post<{ Body: { sessionId: string; targetSessionId: string } }>(
    "/api/wave",
    async (req, reply) => {
      const { sessionId, targetSessionId } = req.body ?? {};
      if (!sessionId || !targetSessionId) {
        return reply.status(400).send({ error: "sessionId and targetSessionId required" });
      }
      if (sessionId === targetSessionId) {
        return reply.status(400).send({ error: "cannot wave at yourself" });
      }
      const { connected } = await sendWave(sessionId, targetSessionId);
      return reply.status(204).send();
    }
  );

  // GET /api/connections — mutual connections
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/connections",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      const connections = await getConnections(sessionId);
      const enriched = await Promise.all(
        connections.map(async (c) => ({
          ...c,
          vehicle: await resolveVehicle(c.otherSessionId),
        }))
      );
      return reply.send({ connections: enriched });
    }
  );

  // POST /api/report
  app.post<{ Body: { sessionId: string; targetSessionId: string; reason?: string } }>(
    "/api/report",
    async (req, reply) => {
      const { sessionId, targetSessionId, reason } = req.body ?? {};
      if (!sessionId || !targetSessionId) {
        return reply.status(400).send({ error: "sessionId and targetSessionId required" });
      }
      // Handled in WS layer too; this is the REST fallback
      return reply.status(204).send();
    }
  );

  // GET /api/stats — public driver count
  app.get("/api/stats", async (_req, reply) => {
    const { getRedis } = await import("../../redis/redisClient");
    const count = await getRedis().zcard("geo:drivers");
    return reply.send({ activeDriverCount: count });
  });
}
