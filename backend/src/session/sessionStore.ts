import {
  getSessionFields,
  setSessionField,
  deleteSession,
  refreshSessionTTL,
  geoRemove,
  removeFromRoom,
} from "../redis/redisClient";
import type { VehicleProfile, RangeKm } from "@driver-intercom/shared";
import { DEFAULT_RANGE_KM } from "@driver-intercom/shared";

export interface SessionData {
  sessionId: string;
  vehicle: VehicleProfile | null;
  rangeKm: RangeKm;
  enabled: boolean;
  currentRoomId: string | null;
  lastSeen: number;
  lat: number | null;
  lng: number | null;
  heading: number | null;
  speed: number | null;
}

export async function createSession(sessionId: string): Promise<void> {
  const now = Date.now();
  await setSessionField(sessionId, "rangeKm", String(DEFAULT_RANGE_KM));
  await setSessionField(sessionId, "enabled", "true");
  await setSessionField(sessionId, "lastSeen", String(now));
  await setSessionField(sessionId, "currentRoomId", "");
}

export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  const fields = await getSessionFields(sessionId);
  if (!fields || !fields.lastSeen) return null;

  let vehicle: VehicleProfile | null = null;
  if (fields.vehicle) {
    try {
      vehicle = JSON.parse(fields.vehicle) as VehicleProfile;
    } catch {
      // malformed — ignore
    }
  }

  return {
    sessionId,
    vehicle,
    rangeKm: (parseFloat(fields.rangeKm ?? "1.6") as RangeKm) || DEFAULT_RANGE_KM,
    enabled: fields.enabled !== "false",
    currentRoomId: fields.currentRoomId || null,
    lastSeen: parseInt(fields.lastSeen, 10),
    lat: fields.lat ? parseFloat(fields.lat) : null,
    lng: fields.lng ? parseFloat(fields.lng) : null,
    heading: fields.heading ? parseFloat(fields.heading) : null,
    speed: fields.speed ? parseFloat(fields.speed) : null,
  };
}

export async function updateSessionLocation(
  sessionId: string,
  lat: number,
  lng: number,
  heading: number | null,
  speed: number | null
): Promise<void> {
  const now = Date.now();
  await setSessionField(sessionId, "lat", String(lat));
  await setSessionField(sessionId, "lng", String(lng));
  if (heading !== null) await setSessionField(sessionId, "heading", String(heading));
  if (speed !== null) await setSessionField(sessionId, "speed", String(speed));
  await setSessionField(sessionId, "lastSeen", String(now));
}

export async function setSessionVehicle(
  sessionId: string,
  vehicle: VehicleProfile
): Promise<void> {
  await setSessionField(sessionId, "vehicle", JSON.stringify(vehicle));
}

export async function setSessionRange(
  sessionId: string,
  rangeKm: number
): Promise<void> {
  await setSessionField(sessionId, "rangeKm", String(rangeKm));
}

export async function setSessionEnabled(
  sessionId: string,
  enabled: boolean
): Promise<void> {
  await setSessionField(sessionId, "enabled", String(enabled));
}

export async function setSessionRoom(
  sessionId: string,
  roomId: string | null
): Promise<void> {
  await setSessionField(sessionId, "currentRoomId", roomId ?? "");
}

export async function evictSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (session?.currentRoomId) {
    await removeFromRoom(session.currentRoomId, sessionId);
  }
  await geoRemove(sessionId);
  await deleteSession(sessionId);
}
