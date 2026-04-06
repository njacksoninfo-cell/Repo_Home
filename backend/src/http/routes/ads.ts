import type { FastifyInstance } from "fastify";
import { getSession } from "../../session/sessionStore";
import { getSubscriptionTier } from "../../subscription/subscriptionService";
import { selectContextualAd, recordImpression, recordClick } from "../../ads/adEngine";

export async function adsRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/ads/contextual — fetch a contextual ad for free-tier users
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/ads/contextual",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      // Only serve ads to free-tier users
      const tier = await getSubscriptionTier(sessionId);
      if (tier !== "free") {
        return reply.status(204).send(); // no ad for paid users
      }

      const session = await getSession(sessionId);
      if (!session) return reply.status(404).send({ error: "session not found" });

      const ad = selectContextualAd(
        session.vehicle?.make ?? null,
        session.lat ?? 0,
        session.lng ?? 0
      );

      // Fire-and-forget impression record
      recordImpression(sessionId, ad).catch(() => {});

      return reply.send({ ad });
    }
  );

  // POST /api/ads/click — record a click
  app.post<{ Body: { sessionId: string; adId: string } }>(
    "/api/ads/click",
    async (req, reply) => {
      const { sessionId, adId } = req.body ?? {};
      if (!sessionId || !adId) {
        return reply.status(400).send({ error: "sessionId and adId required" });
      }
      recordClick(sessionId, adId).catch(() => {});
      return reply.status(204).send();
    }
  );
}
