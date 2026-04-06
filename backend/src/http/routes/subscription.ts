import type { FastifyInstance } from "fastify";
import { getSession } from "../../session/sessionStore";
import {
  getSubscriptionTier,
  upsertSubscription,
  validateReceipt,
} from "../../subscription/subscriptionService";
import { TIER_RANGE_LIMITS, TIER_HISTORY_DAYS } from "@driver-intercom/shared";

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/subscription/status — current tier + entitlements
  app.get<{ Querystring: { sessionId: string } }>(
    "/api/subscription/status",
    async (req, reply) => {
      const { sessionId } = req.query;
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      const session = await getSession(sessionId);
      if (!session) return reply.status(404).send({ error: "session not found" });

      const tier = await getSubscriptionTier(sessionId);
      return reply.send({
        tier,
        entitlements: {
          allowedRangesKm: TIER_RANGE_LIMITS[tier],
          historyDays: TIER_HISTORY_DAYS[tier],
          adsEnabled: tier === "free",
          fleetAccess: tier === "fleet",
          regularNotifications: tier !== "free",
          verifiedVehicleBadge: tier !== "free",
        },
      });
    }
  );

  // POST /api/subscription/validate — submit IAP receipt for validation
  app.post<{
    Body: {
      sessionId: string;
      productId: string;
      receiptData: string;
      platform: "ios" | "android";
    };
  }>("/api/subscription/validate", async (req, reply) => {
    const { sessionId, productId, receiptData, platform } = req.body ?? {};
    if (!sessionId || !productId || !receiptData || !platform) {
      return reply.status(400).send({ error: "sessionId, productId, receiptData, platform required" });
    }

    const session = await getSession(sessionId);
    if (!session) return reply.status(404).send({ error: "session not found" });

    const { valid, tier, expiresAt } = await validateReceipt(
      sessionId,
      productId,
      receiptData,
      platform
    );

    if (!valid) {
      return reply.status(402).send({ error: "receipt validation failed" });
    }

    await upsertSubscription(sessionId, tier, platform, productId, receiptData, expiresAt);

    return reply.send({
      tier,
      expiresAt,
      entitlements: {
        allowedRangesKm: TIER_RANGE_LIMITS[tier],
        historyDays: TIER_HISTORY_DAYS[tier],
        adsEnabled: tier === "free",
        fleetAccess: tier === "fleet",
        regularNotifications: tier !== "free",
        verifiedVehicleBadge: tier !== "free",
      },
    });
  });

  // POST /api/subscription/restore — restore purchases (calls RevenueCat)
  app.post<{ Body: { sessionId: string } }>(
    "/api/subscription/restore",
    async (req, reply) => {
      const { sessionId } = req.body ?? {};
      if (!sessionId) return reply.status(400).send({ error: "sessionId required" });

      const tier = await getSubscriptionTier(sessionId);
      return reply.send({ tier, restored: true });
    }
  );
}
