import type { FastifyInstance } from "fastify";
import { getSession, setSessionVehicle } from "../../session/sessionStore";
import {
  getOrCreateConvoyCode,
  resolveConvoyCode,
  sendWave,
} from "../../social/waveService";
import type { VehicleProfile } from "@proximity/shared";

export async function profileRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/profile — get current session's vehicle profile
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/profile",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });
      const session = await getSession(sessionId);
      if (!session) return reply.status(404).send({ error: "session not found" });
      return reply.send({ vehicle: session.vehicle });
    }
  );

  // PUT /api/profile — update vehicle profile
  app.put<{ Body: { sessionId: string; vehicle: VehicleProfile } }>(
    "/api/profile",
    async (req, reply) => {
      const { sessionId, vehicle } = req.body ?? {};
      if (!sessionId || !vehicle) {
        return reply.status(400).send({ error: "sessionId and vehicle required" });
      }
      const session = await getSession(sessionId);
      if (!session) return reply.status(404).send({ error: "session not found" });

      await setSessionVehicle(sessionId, vehicle);
      return reply.status(200).send({ ok: true });
    }
  );

  // GET /api/profile/code — get or generate convoy code
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/profile/code",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });
      const code = await getOrCreateConvoyCode(sessionId);
      return reply.send({ convoCode: code });
    }
  );

  // POST /api/profile/link — connect two sessions via convoy code
  app.post<{ Body: { sessionId: string; convoCode: string } }>(
    "/api/profile/link",
    async (req, reply) => {
      const { sessionId, convoCode } = req.body ?? {};
      if (!sessionId || !convoCode) {
        return reply.status(400).send({ error: "sessionId and convoCode required" });
      }
      const targetSessionId = await resolveConvoyCode(convoCode);
      if (!targetSessionId) {
        return reply.status(404).send({ error: "convoy code not found" });
      }
      if (targetSessionId === sessionId) {
        return reply.status(400).send({ error: "cannot link to yourself" });
      }
      // Link by sending mutual waves
      await sendWave(sessionId, targetSessionId);
      await sendWave(targetSessionId, sessionId);
      return reply.status(200).send({ ok: true, linkedTo: targetSessionId });
    }
  );
}
