import { getRedis, geoRemove } from "../redis/redisClient";
import { evictSession, getSession } from "../session/sessionStore";
import { handleDisconnect } from "../ws/handlers/disconnectHandler";
import { config } from "../config";

let evictionTimer: ReturnType<typeof setInterval> | null = null;

export function startEvictionJob(): void {
  if (evictionTimer) return;

  evictionTimer = setInterval(async () => {
    try {
      await runEviction();
    } catch (err) {
      console.error("[EvictionJob] error:", (err as Error).message);
    }
  }, 10_000); // every 10 seconds

  console.log("[EvictionJob] started");
}

export function stopEvictionJob(): void {
  if (evictionTimer) {
    clearInterval(evictionTimer);
    evictionTimer = null;
  }
}

async function runEviction(): Promise<void> {
  const redis = getRedis();
  // Get all members of the geo set
  const members = await redis.zrange("geo:drivers", 0, -1);
  const staleThreshold = Date.now() - config.staleDriverMs;
  let evicted = 0;

  for (const sessionId of members) {
    const session = await getSession(sessionId);
    if (!session) {
      // Session hash gone but geo entry remains — clean it up
      await geoRemove(sessionId);
      evicted++;
      continue;
    }
    if (session.lastSeen < staleThreshold) {
      await handleDisconnect(sessionId);
      evicted++;
    }
  }

  if (evicted > 0) {
    console.log(`[EvictionJob] evicted ${evicted} stale driver(s)`);
  }
}
