import { query } from "../db/pgClient";
import { sendToSession } from "../ws/broadcaster";
import { getSession } from "../session/sessionStore";
import { getRedis } from "../redis/redisClient";

/**
 * Record a wave from one session to another.
 * If the target has already waved at the sender, form a connection.
 * Returns true if this wave completed a mutual connection.
 */
export async function sendWave(
  fromSessionId: string,
  toSessionId: string
): Promise<{ connected: boolean }> {
  const now = Date.now();

  // Upsert wave record
  await query(
    `INSERT INTO waves (from_session, to_session, sent_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (from_session, to_session) DO UPDATE SET sent_at = $3`,
    [fromSessionId, toSessionId, now]
  );

  // Check if the other party has already waved at us
  const existing = await query<{ id: string }>(
    `SELECT id FROM waves WHERE from_session = $1 AND to_session = $2`,
    [toSessionId, fromSessionId]
  );

  let connected = false;

  if (existing.length > 0) {
    // Mutual wave — create or increment connection
    const [a, b] =
      fromSessionId < toSessionId
        ? [fromSessionId, toSessionId]
        : [toSessionId, fromSessionId];

    await query(
      `INSERT INTO connections (session_a, session_b, connected_at, wave_count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (session_a, session_b) DO UPDATE
         SET wave_count = connections.wave_count + 1`,
      [a, b, now]
    );

    connected = true;
  }

  // Notify the target via WebSocket (if connected)
  const fromSession = await getSession(fromSessionId);
  if (fromSession?.vehicle) {
    sendToSession(toSessionId, {
      type: "wave_received",
      payload: {
        fromSessionId,
        vehicle: fromSession.vehicle,
      },
    });
  }

  return { connected };
}

/** Get all connections for a session */
export async function getConnections(
  sessionId: string
): Promise<{ otherSessionId: string; connectedAt: number; waveCount: number }[]> {
  const rows = await query<{
    session_a: string;
    session_b: string;
    connected_at: string;
    wave_count: string;
  }>(
    `SELECT session_a, session_b, connected_at, wave_count
     FROM connections
     WHERE session_a = $1 OR session_b = $1
     ORDER BY connected_at DESC`,
    [sessionId]
  );

  return rows.map((r) => ({
    otherSessionId:
      r.session_a === sessionId ? r.session_b : r.session_a,
    connectedAt: parseInt(r.connected_at, 10),
    waveCount: parseInt(r.wave_count, 10),
  }));
}

/** Generate or retrieve a 6-char convoy code for a session */
export async function getOrCreateConvoyCode(sessionId: string): Promise<string> {
  const cacheKey = `convoy_code:${sessionId}`;
  const redis = getRedis();

  let code = await redis.get(cacheKey);
  if (code) return code;

  // Generate a new random alphanumeric 6-char code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  code = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");

  // Store code → sessionId mapping (persistent) and reverse (for lookup)
  await redis.set(`code:${code}`, sessionId);
  await redis.set(cacheKey, code);

  return code;
}

/** Look up the sessionId for a convoy code */
export async function resolveConvoyCode(code: string): Promise<string | null> {
  return getRedis().get(`code:${code.toUpperCase()}`);
}
