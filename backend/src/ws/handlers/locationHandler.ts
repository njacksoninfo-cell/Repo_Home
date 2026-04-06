import { geoAdd } from "../../redis/redisClient";
import {
  updateSessionLocation,
  getSession,
} from "../../session/sessionStore";
import { evaluateProximity, distanceMiles, computeBearing } from "../../geo/proximityEngine";
import { generateRoomToken } from "../../livekit/tokenService";
import { broadcastToSessions, sendToSession } from "../broadcaster";
import { config } from "../../config";
import { getRegularCount } from "../../social/regularEngine";
import type { VehicleProfile } from "@driver-intercom/shared";
import { MAX_SAFE_SPEED_MS } from "@driver-intercom/shared";

export async function handleLocationUpdate(
  sessionId: string,
  lat: number,
  lng: number,
  accuracy: number,
  heading: number | null,
  speed: number | null
): Promise<void> {
  // 1. Persist location in Redis session + geo index
  await updateSessionLocation(sessionId, lat, lng, heading, speed);
  await geoAdd(sessionId, lng, lat);

  const session = await getSession(sessionId);
  if (!session) return;
  if (!session.enabled) return;

  // 2. Re-evaluate proximity group
  const { roomId, changed, members } = await evaluateProximity(
    sessionId,
    lat,
    lng,
    session.rangeKm
  );

  // 3. Broadcast nearby count to all members
  broadcastToSessions(members, {
    type: "nearby_count",
    payload: { count: members.length },
  });

  if (!changed) return;

  // 4. New room assignment — send token + notify room
  const livekitToken = generateRoomToken(sessionId, roomId);
  sendToSession(sessionId, {
    type: "room_reassign",
    payload: {
      roomId,
      livekitToken,
      livekitUrl: config.livekit.url,
    },
  });

  // 5. Notify existing room members that a new driver joined
  const otherMembers = members.filter((s) => s !== sessionId);
  if (otherMembers.length > 0 && session.vehicle) {
    const isRegular = await getRegularCount(otherMembers[0], sessionId) >= 3;
    broadcastToSessions(otherMembers, {
      type: "driver_joined",
      payload: {
        count: members.length,
        vehicle: session.vehicle,
        isRegular,
      },
    });
  }
}
