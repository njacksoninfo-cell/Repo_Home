import { query } from "../db/pgClient";
import { getRoomMembers } from "../redis/redisClient";
import { getSession } from "../session/sessionStore";

/**
 * Called when a driver joins a room — open encounter records with all
 * existing members.
 */
export async function startEncounters(
  sessionId: string,
  roomId: string
): Promise<void> {
  const members = await getRoomMembers(roomId);
  const others = members.filter((s) => s !== sessionId);
  const now = Date.now();

  await Promise.all(
    others.map((otherId) =>
      query(
        `INSERT INTO drive_encounters
           (session_id, encountered_id, room_id, started_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (session_id, encountered_id, started_at) DO NOTHING`,
        [sessionId, otherId, roomId, now]
      )
    )
  );
}

/**
 * Called when a driver leaves or disconnects — close any open encounter
 * records for this session in this room.
 */
export async function endEncounters(
  sessionId: string,
  roomId: string
): Promise<void> {
  const now = Date.now();
  await query(
    `UPDATE drive_encounters
     SET ended_at = $1,
         duration_seconds = FLOOR(($1 - started_at) / 1000)
     WHERE session_id = $2
       AND room_id    = $3
       AND ended_at IS NULL`,
    [now, sessionId, roomId]
  );
}

/**
 * Returns the N most recent distinct vehicles this session encountered,
 * with duration and last-seen time. Used for the post-drive summary.
 */
export async function getRecentEncounters(
  sessionId: string,
  limitDays = 30
): Promise<
  { encounteredId: string; durationSeconds: number; lastSeenAt: number }[]
> {
  const cutoff = Date.now() - limitDays * 24 * 60 * 60 * 1000;
  const rows = await query<{
    encountered_id: string;
    total_duration: string;
    last_seen: string;
  }>(
    `SELECT encountered_id,
            SUM(duration_seconds) AS total_duration,
            MAX(started_at)       AS last_seen
     FROM drive_encounters
     WHERE session_id = $1
       AND started_at >= $2
       AND ended_at IS NOT NULL
     GROUP BY encountered_id
     ORDER BY last_seen DESC
     LIMIT 50`,
    [sessionId, cutoff]
  );

  return rows.map((r) => ({
    encounteredId: r.encountered_id,
    durationSeconds: parseInt(r.total_duration, 10),
    lastSeenAt: parseInt(r.last_seen, 10),
  }));
}
