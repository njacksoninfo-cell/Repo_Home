import { getRoomMembers } from "../../redis/redisClient";
import { evictSession, getSession } from "../../session/sessionStore";
import { broadcastToSessions, unregisterConnection } from "../broadcaster";
import { handlePttStop } from "./pttHandler";
import { endEncounters } from "../../social/encounterTracker";

export async function handleDisconnect(sessionId: string): Promise<void> {
  // Stop any active PTT
  await handlePttStop(sessionId);

  // Get room before evicting
  const session = await getSession(sessionId);
  const roomId = session?.currentRoomId;
  let members: string[] = [];

  if (roomId) {
    members = await getRoomMembers(roomId);
    const others = members.filter((s) => s !== sessionId);

    // Notify others that driver left
    if (others.length > 0) {
      broadcastToSessions(others, {
        type: "driver_left",
        payload: { count: others.length },
      });
    }

    // End any open encounter records for this session
    await endEncounters(sessionId, roomId);
  }

  unregisterConnection(sessionId);
  await evictSession(sessionId);
}
