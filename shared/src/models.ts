import type { RangeKm, VehicleColor, SubscriptionTier } from "./constants";

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

// ─── Subscription ─────────────────────────────────────────────────────────────

export interface Subscription {
  sessionId: string;
  tier: SubscriptionTier;
  platform: "ios" | "android" | "web" | null;
  productId: string | null;
  expiresAt: number | null; // unix ms, null = lifetime/free
  createdAt: number;
}

// ─── Fleet / Car Club ─────────────────────────────────────────────────────────

export interface Fleet {
  id: string;           // uuid
  name: string;
  description: string | null;
  type: "car_club" | "fleet_business";
  adminSessionId: string;
  inviteCode: string;   // 6-char code for joining
  memberCount: number;
  createdAt: number;
  roomId: string;       // persistent LiveKit room for fleet comms
}

export interface FleetMember {
  fleetId: string;
  sessionId: string;
  role: "admin" | "member";
  joinedAt: number;
}

// ─── Contextual Ads ───────────────────────────────────────────────────────────

export interface ContextualAd {
  id: string;
  advertiser: string;      // e.g. "Shell", "AutoZone"
  headline: string;        // e.g. "$0.10 off per gallon"
  subtext: string;         // e.g. "Exit 14 · 0.3 mi ahead"
  category: AdCategory;
  ctaLabel: string;        // "Get Deal", "Get Quote", "Learn More"
  ctaUrl: string;
  logoEmoji: string;       // placeholder until real logos
}

export const AD_CATEGORIES = [
  "fuel",
  "auto_parts",
  "auto_service",
  "insurance",
  "food_drive_thru",
  "ev_charging",
] as const;
export type AdCategory = (typeof AD_CATEGORIES)[number];

// ─── Insurance Lead ───────────────────────────────────────────────────────────

export interface InsuranceLead {
  id: number;
  sessionId: string;
  vehicle: VehicleProfile;
  zipCode: string | null;
  submittedAt: number;
  partner: string;  // e.g. "Progressive", "Geico"
}
