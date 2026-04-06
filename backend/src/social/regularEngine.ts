import { query } from "../db/pgClient";
import { getRedis } from "../redis/redisClient";
import { REGULARS_ENCOUNTER_THRESHOLD } from "@proximity/shared";

const CACHE_TTL = 60 * 60; // 1 hour

function regularCacheKey(a: string, b: string): string {
  // canonical order
  const [first, second] = a < b ? [a, b] : [b, a];
  return `regular:${first}:${second}`;
}

/** Returns the total number of encounters between two sessions */
export async function getRegularCount(
  sessionA: string,
  sessionB: string
): Promise<number> {
  const cacheKey = regularCacheKey(sessionA, sessionB);
  const cached = await getRedis().get(cacheKey);
  if (cached !== null) return parseInt(cached, 10);

  const rows = await query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt
     FROM drive_encounters
     WHERE session_id = $1 AND encountered_id = $2`,
    [sessionA, sessionB]
  );

  const count = parseInt(rows[0]?.cnt ?? "0", 10);
  await getRedis().setex(cacheKey, CACHE_TTL, String(count));
  return count;
}

/** Returns true if the two sessions have met enough to be "Regulars" */
export async function areRegulars(
  sessionA: string,
  sessionB: string
): Promise<boolean> {
  const count = await getRegularCount(sessionA, sessionB);
  return count >= REGULARS_ENCOUNTER_THRESHOLD;
}

/** Get all "Regular" counterparts for a session, sorted by encounter count */
export async function getRegulars(
  sessionId: string
): Promise<{ encounteredId: string; encounterCount: number; lastSeenAt: number }[]> {
  const rows = await query<{
    encountered_id: string;
    cnt: string;
    last_seen: string;
  }>(
    `SELECT encountered_id,
            COUNT(*)       AS cnt,
            MAX(started_at) AS last_seen
     FROM drive_encounters
     WHERE session_id = $1
     GROUP BY encountered_id
     HAVING COUNT(*) >= $2
     ORDER BY cnt DESC
     LIMIT 100`,
    [sessionId, REGULARS_ENCOUNTER_THRESHOLD]
  );

  return rows.map((r) => ({
    encounteredId: r.encountered_id,
    encounterCount: parseInt(r.cnt, 10),
    lastSeenAt: parseInt(r.last_seen, 10),
  }));
}
