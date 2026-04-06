import type { RangeKm, VehicleColor } from "./constants";

export interface VehicleProfile {
  color: VehicleColor;
  year: string | null; // e.g. "'19", "'23"
  make: string; // e.g. "Honda", "Ford"
  model: string; // e.g. "Civic", "F-150"
  nickname: string | null; // optional custom label
}

export function vehicleDisplayName(v: VehicleProfile): string {
  const parts: string[] = [v.color];
  if (v.year) parts.push(v.year);
  parts.push(v.make, v.model);
  const base = parts.join(" ");
  return v.nickname ? `${base} · ${v.nickname}` : base;
}

export interface DriverSession {
  sessionId: string; // uuid v4, client-generated
  vehicle: VehicleProfile;
  rangeKm: RangeKm;
  enabled: boolean;
  currentRoomId: string | null;
  lastSeen: number; // unix ms
}

export interface DriverLocation {
  sessionId: string;
  latitude: number;
  longitude: number;
  accuracy: number; // meters
  heading: number | null; // degrees 0-360
  speed: number | null; // m/s
  timestamp: number; // unix ms
}

export interface ProximityRoom {
  roomId: string;
  memberCount: number;
  createdAt: number;
}

export interface ActiveSpeaker {
  sessionId: string;
  vehicle: VehicleProfile;
  distanceMi: number | null;
  bearingDeg: number | null;
  isRegular: boolean;
  startedAt: number;
}

// Social graph models (persisted in PostgreSQL)
export interface DriveEncounter {
  id: number;
  sessionId: string;
  encounteredSessionId: string;
  roomId: string;
  startedAt: number; // unix ms
  endedAt: number | null; // unix ms, null if still ongoing
  durationSeconds: number;
}

export interface Connection {
  id: number;
  sessionA: string;
  sessionB: string;
  connectedAt: number; // unix ms
  waveCount: number;
}

export interface Wave {
  id: number;
  fromSessionId: string;
  toSessionId: string;
  sentAt: number; // unix ms
}
