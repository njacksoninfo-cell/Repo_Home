import Redis from "ioredis";
import { config } from "../config";

// Singleton Redis client
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
    _redis.on("error", (err) => {
      console.error("[Redis] connection error:", err.message);
    });
    _redis.on("connect", () => {
      console.log("[Redis] connected");
    });
  }
  return _redis;
}

// ─── GEO helpers ─────────────────────────────────────────────────────────────

const GEO_KEY = "geo:drivers";

/** Update or insert a driver's position */
export async function geoAdd(
  sessionId: string,
  lng: number,
  lat: number
): Promise<void> {
  await getRedis().geoadd(GEO_KEY, lng, lat, sessionId);
}

/** Remove a driver from the geo index */
export async function geoRemove(sessionId: string): Promise<void> {
  await getRedis().zrem(GEO_KEY, sessionId);
}

/** Find all session IDs within radiusKm of a point */
export async function geoSearch(
  lng: number,
  lat: number,
  radiusKm: number
): Promise<{ sessionId: string; distanceKm: number }[]> {
  const redis = getRedis();
  // GEOSEARCH key FROMLONLAT lng lat BYRADIUS radius km ASC WITHCOORD WITHDIST COUNT 200
  const results = (await redis.call(
    "GEOSEARCH",
    GEO_KEY,
    "FROMLONLAT",
    lng,
    lat,
    "BYRADIUS",
    radiusKm,
    "km",
    "ASC",
    "WITHDIST",
    "COUNT",
    "200"
  )) as [string, string][];

  if (!Array.isArray(results)) return [];

  return results.map(([sessionId, distStr]) => ({
    sessionId,
    distanceKm: parseFloat(distStr),
  }));
}

// ─── Session helpers ──────────────────────────────────────────────────────────

const SESSION_TTL = 60 * 30; // 30 minutes

export function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

export async function setSessionField(
  sessionId: string,
  field: string,
  value: string
): Promise<void> {
  const key = sessionKey(sessionId);
  await getRedis().hset(key, field, value);
  await getRedis().expire(key, SESSION_TTL);
}

export async function getSessionFields(
  sessionId: string
): Promise<Record<string, string>> {
  return getRedis().hgetall(sessionKey(sessionId));
}

export async function refreshSessionTTL(sessionId: string): Promise<void> {
  await getRedis().expire(sessionKey(sessionId), SESSION_TTL);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await getRedis().del(sessionKey(sessionId));
}

// ─── Room membership helpers ──────────────────────────────────────────────────

export function roomKey(roomId: string): string {
  return `room:${roomId}:members`;
}

export async function addToRoom(
  roomId: string,
  sessionId: string
): Promise<void> {
  await getRedis().sadd(roomKey(roomId), sessionId);
  await getRedis().expire(roomKey(roomId), 3600);
}

export async function removeFromRoom(
  roomId: string,
  sessionId: string
): Promise<void> {
  await getRedis().srem(roomKey(roomId), sessionId);
}

export async function getRoomMembers(roomId: string): Promise<string[]> {
  return getRedis().smembers(roomKey(roomId));
}

// ─── PTT state ────────────────────────────────────────────────────────────────

export async function setPttActive(
  sessionId: string,
  roomId: string
): Promise<void> {
  await getRedis().hset("ptt:active", sessionId, `${roomId}:${Date.now()}`);
}

export async function clearPttActive(sessionId: string): Promise<void> {
  await getRedis().hdel("ptt:active", sessionId);
}

// ─── Abuse / report state ─────────────────────────────────────────────────────

/** Returns the report count for a target in the last windowMs */
export async function getRecentReportCount(
  targetSessionId: string,
  windowMs: number
): Promise<number> {
  const key = `reports:${targetSessionId}`;
  const cutoff = Date.now() - windowMs;
  // Remove stale entries, then count
  await getRedis().zremrangebyscore(key, "-inf", cutoff);
  return getRedis().zcard(key);
}

export async function recordReport(
  targetSessionId: string,
  reporterId: string
): Promise<void> {
  const key = `reports:${targetSessionId}`;
  const now = Date.now();
  await getRedis().zadd(key, now, `${reporterId}:${now}`);
  await getRedis().expire(key, 3600);
}
