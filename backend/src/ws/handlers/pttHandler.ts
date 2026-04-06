import {
  setPttActive,
  clearPttActive,
  getRoomMembers,
} from "../../redis/redisClient";
import { getSession } from "../../session/sessionStore";
import {
  distanceMiles,
  computeBearing,
} from "../../geo/proximityEngine";
import { broadcastToSessions } from "../broadcaster";
import { getRegularCount } from "../../social/regularEngine";
import { MAX_SAFE_SPEED_MS } from "@driver-intercom/shared";

// Track last PTT timestamp per session for rate limiting
const lastPttMs = new Map<string, number>();

export async function handlePttStart(sessionId: string): Promise<void> {
  const now = Date.now();
  const last = lastPttMs.get(sessionId) ?? 0;
  if (now - last < 500) return; // rate limit: 1 PTT per 500ms
  lastPttMs.set(sessionId, now);

  const session = await getSession(sessionId);
  if (!session?.enabled || !session.currentRoomId || !session.vehicle) return;

  // Speed gate: silence at highway+ speeds
  if (session.speed !== null && session.speed > MAX_SAFE_SPEED_MS) return;

  await setPttActive(sessionId, session.currentRoomId);

  const members = await getRoomMembers(session.currentRoomId);
  const others = members.filter((s) => s !== sessionId);

  // Build speaker_start events with distance/bearing for each recipient
  await Promise.all(
    others.map(async (recipientId) => {
      const recipient = await getSession(recipientId);
      if (!recipient) return;

      let distanceMi: number | null = null;
      let bearingDeg: number | null = null;

      if (
        session.lat !== null &&
        session.lng !== null &&
        recipient.lat !== null &&
        recipient.lng !== null
      ) {
        distanceMi = parseFloat(
          distanceMiles(
            recipient.lat,
            recipient.lng,
            session.lat,
            session.lng
          ).toFixed(1)
        );
        bearingDeg = Math.round(
          computeBearing(
            recipient.lat,
            recipient.lng,
            session.lat,
            session.lng
          )
        );
      }

      const isRegular = (await getRegularCount(recipientId, sessionId)) >= 3;

      broadcastToSessions([recipientId], {
        type: "speaker_start",
        payload: {
          sessionId,
          vehicle: session.vehicle!,
          distanceMi,
          bearingDeg,
          isRegular,
        },
      });
    })
  );
}

export async function handlePttStop(sessionId: string): Promise<void> {
  await clearPttActive(sessionId);

  const session = await getSession(sessionId);
  if (!session?.currentRoomId) return;

  const members = await getRoomMembers(session.currentRoomId);
  const others = members.filter((s) => s !== sessionId);

  broadcastToSessions(others, {
    type: "speaker_stop",
    payload: { sessionId },
  });
}
