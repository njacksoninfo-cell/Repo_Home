import { query } from "../db/pgClient";
import { getRedis } from "../redis/redisClient";
import type { SubscriptionTier } from "@driver-intercom/shared";

const CACHE_TTL = 60 * 5; // 5 minutes

function tierCacheKey(sessionId: string): string {
  return `sub:tier:${sessionId}`;
}

/** Get the active subscription tier for a session (Redis-cached) */
export async function getSubscriptionTier(
  sessionId: string
): Promise<SubscriptionTier> {
  const cached = await getRedis().get(tierCacheKey(sessionId));
  if (cached) return cached as SubscriptionTier;

  const rows = await query<{ tier: string; expires_at: string | null }>(
    `SELECT tier, expires_at FROM subscriptions WHERE session_id = $1`,
    [sessionId]
  );

  if (rows.length === 0) {
    await getRedis().setex(tierCacheKey(sessionId), CACHE_TTL, "free");
    return "free";
  }

  const row = rows[0];
  const now = Date.now();
  // If subscription is expired, treat as free
  const tier =
    row.expires_at && parseInt(row.expires_at, 10) < now
      ? "free"
      : (row.tier as SubscriptionTier);

  await getRedis().setex(tierCacheKey(sessionId), CACHE_TTL, tier);
  return tier;
}

/** Upsert a subscription record after successful IAP validation */
export async function upsertSubscription(
  sessionId: string,
  tier: SubscriptionTier,
  platform: string,
  productId: string,
  receiptData: string,
  expiresAt: number | null
): Promise<void> {
  const now = Date.now();
  await query(
    `INSERT INTO subscriptions
       (session_id, tier, platform, product_id, receipt_data, expires_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
     ON CONFLICT (session_id) DO UPDATE SET
       tier         = EXCLUDED.tier,
       platform     = EXCLUDED.platform,
       product_id   = EXCLUDED.product_id,
       receipt_data = EXCLUDED.receipt_data,
       expires_at   = EXCLUDED.expires_at,
       updated_at   = EXCLUDED.updated_at`,
    [sessionId, tier, platform, productId, receiptData, expiresAt, now]
  );
  // Invalidate cache
  await getRedis().del(tierCacheKey(sessionId));
}

/**
 * Validate a RevenueCat webhook or receipt.
 * In production, call RevenueCat's REST API to verify the purchase.
 * Here we stub the validation and trust the client-reported tier.
 * Replace with: https://api.revenuecat.com/v1/subscribers/{app_user_id}
 */
export async function validateReceipt(
  sessionId: string,
  productId: string,
  receiptData: string,
  platform: "ios" | "android"
): Promise<{ valid: boolean; tier: SubscriptionTier; expiresAt: number | null }> {
  // TODO: replace stub with RevenueCat API call
  // const rcResponse = await fetch(`https://api.revenuecat.com/v1/subscribers/${sessionId}`, {
  //   headers: { Authorization: `Bearer ${config.revenueCat.apiKey}` }
  // });

  let tier: SubscriptionTier = "free";
  let expiresAt: number | null = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

  if (productId === "di_pro_monthly" || productId === "di_pro_annual") {
    tier = "pro";
    if (productId === "di_pro_annual") {
      expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    }
  } else if (productId === "di_fleet_monthly") {
    tier = "fleet";
  }

  return { valid: true, tier, expiresAt };
}
