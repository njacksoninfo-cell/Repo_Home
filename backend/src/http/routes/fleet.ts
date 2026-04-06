import type { FastifyInstance } from "fastify";
import { getSession } from "../../session/sessionStore";
import { getSubscriptionTier } from "../../subscription/subscriptionService";
import {
  createFleet,
  joinFleet,
  getSessionFleets,
  getFleetToken,
  leaveFleet,
} from "../../fleet/fleetService";

export async function fleetRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/fleets — list fleets the session belongs to
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/fleets",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      const fleets = await getSessionFleets(sessionId);
      return reply.send({ fleets });
    }
  );

  // POST /api/fleets — create a fleet (requires pro or fleet tier)
  app.post<{
    Body: {
      sessionId: string;
      name: string;
      description?: string;
      type: "car_club" | "fleet_business";
    };
  }>("/api/fleets", async (req, reply) => {
    const { sessionId, name, description, type } = req.body ?? {};
    if (!sessionId || !name || !type) {
      return reply.status(400).send({ error: "sessionId, name, and type required" });
    }

    const session = await getSession(sessionId);
    if (!session) return reply.status(404).send({ error: "session not found" });

    // Fleet creation requires a paid tier
    const tier = await getSubscriptionTier(sessionId);
    if (tier === "free") {
      return reply.status(402).send({
        error: "pro_required",
        message: "Creating a fleet requires a Pro or Fleet subscription",
      });
    }

    const fleet = await createFleet(
      sessionId,
      name.trim(),
      description?.trim() ?? null,
      type
    );
    return reply.status(201).send({ fleet });
  });

  // POST /api/fleets/join — join via invite code
  app.post<{ Body: { sessionId: string; inviteCode: string } }>(
    "/api/fleets/join",
    async (req, reply) => {
      const { sessionId, inviteCode } = req.body ?? {};
      if (!sessionId || !inviteCode) {
        return reply.status(400).send({ error: "sessionId and inviteCode required" });
      }

      const session = await getSession(sessionId);
      if (!session) return reply.status(404).send({ error: "session not found" });

      try {
        const { fleet, token } = await joinFleet(sessionId, inviteCode);
        return reply.send({ fleet, token, livekitUrl: process.env.LIVEKIT_URL });
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "invite_code_not_found") {
          return reply.status(404).send({ error: "invite code not found" });
        }
        throw err;
      }
    }
  );

  // GET /api/fleets/:fleetId/token — get LiveKit token for fleet channel
  app.get<{ Params: { fleetId: string }; Querystring: { sessionId: string } }>(
    "/api/fleets/:fleetId/token",
    async (req, reply) => {
      const { fleetId } = req.params;
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      try {
        const { token, livekitUrl } = await getFleetToken(sessionId, fleetId);
        return reply.send({ token, livekitUrl });
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "not_a_member") return reply.status(403).send({ error: "not a member of this fleet" });
        if (msg === "fleet_not_found") return reply.status(404).send({ error: "fleet not found" });
        throw err;
      }
    }
  );

  // DELETE /api/fleets/:fleetId/leave — leave a fleet
  app.delete<{ Params: { fleetId: string }; Body: { sessionId: string } }>(
    "/api/fleets/:fleetId/leave",
    async (req, reply) => {
      const { fleetId } = req.params;
      const { sessionId } = req.body ?? {};
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      await leaveFleet(sessionId, fleetId);
      return reply.status(204).send();
    }
  );
}
