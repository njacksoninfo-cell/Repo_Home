import { createHash } from "crypto";
import {
  geoSearch,
  addToRoom,
  removeFromRoom,
  getRedis,
} from "../redis/redisClient";
import { getSession, setSessionRoom } from "../session/sessionStore";

/**
 * Compute a deterministic, stable room ID from a set of session IDs.
 * Sorting ensures the same set always produces the same ID regardless of
 * the order sessions joined.
 */
export function computeRoomId(sessionIds: string[]): string {
  const sorted = [...sessionIds].sort();
  const hash = createHash("sha256").update(sorted.join(",")).digest("hex");
  return `room:${hash.slice(0, 8)}`;
}

export interface ProximityResult {
  roomId: string;
  /** true if the driver's room assignment changed */
  changed: boolean;
  /** all session IDs now in the room (including this driver) */
  members: string[];
}

/**
 * Re-evaluate a driver's proximity group after a location update.
 * Returns the (possibly unchanged) room assignment.
 */
export async function evaluateProximity(
  sessionId: string,
  lat: number,
  lng: number,
  rangeKm: number
): Promise<ProximityResult> {
  // 1. Find all sessions within range
  const nearby = await geoSearch(lng, lat, rangeKm);

  // 2. Filter to enabled sessions only
  const enabledSessions: string[] = [];
  await Promise.all(
    nearby.map(async ({ sessionId: sid }) => {
      if (sid === sessionId) {
        enabledSessions.push(sid);
        return;
      }
      const s = await getSession(sid);
      if (s && s.enabled) enabledSessions.push(sid);
    })
  );

  // Always include self
  if (!enabledSessions.includes(sessionId)) {
    enabledSessions.push(sessionId);
  }

  // 3. Compute deterministic room ID
  const newRoomId = computeRoomId(enabledSessions);

  // 4. Check current room
  const session = await getSession(sessionId);
  const oldRoomId = session?.currentRoomId ?? null;

  if (oldRoomId === newRoomId) {
    return { roomId: newRoomId, changed: false, members: enabledSessions };
  }

  // 5. Move session to new room
  if (oldRoomId) {
    await removeFromRoom(oldRoomId, sessionId);
  }
  await addToRoom(newRoomId, sessionId);
  await setSessionRoom(sessionId, newRoomId);

  return { roomId: newRoomId, changed: true, members: enabledSessions };
}

/**
 * Compute bearing in degrees (0–360) from one lat/lng to another.
 */
export function computeBearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Haversine distance in miles between two lat/lng points.
 */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
