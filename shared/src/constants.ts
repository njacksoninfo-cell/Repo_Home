// Proximity range options in kilometers
export const RANGE_OPTIONS_KM = [0.4, 0.8, 1.6, 8.0] as const;
export type RangeKm = (typeof RANGE_OPTIONS_KM)[number];

// Display labels for range options
export const RANGE_LABELS: Record<RangeKm, string> = {
  0.4: "0.25 mi",
  0.8: "0.5 mi",
  1.6: "1 mi",
  8.0: "5 mi",
};

export const DEFAULT_RANGE_KM: RangeKm = 1.6;

// Session TTL in seconds (30 minutes)
export const SESSION_TTL_SECONDS = 60 * 30;

// How often the client sends GPS pings (ms)
export const LOCATION_PING_INTERVAL_MS = 4000;

// Max speed before inbound audio is silenced (m/s ≈ 90 mph)
export const MAX_SAFE_SPEED_MS = 40;

// Regulars threshold: number of encounters to become a "Regular"
export const REGULARS_ENCOUNTER_THRESHOLD = 3;

// Vehicle color options
export const VEHICLE_COLORS = [
  "Black",
  "White",
  "Silver",
  "Gray",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Brown",
  "Purple",
  "Gold",
  "Beige",
] as const;
export type VehicleColor = (typeof VEHICLE_COLORS)[number];

// ─── Subscription tiers ───────────────────────────────────────────────────────

export const SUBSCRIPTION_TIERS = ["free", "pro", "fleet"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/** Ranges available per tier */
export const TIER_RANGE_LIMITS: Record<SubscriptionTier, RangeKm[]> = {
  free: [0.4, 0.8],           // 0.25 mi and 0.5 mi only
  pro: [0.4, 0.8, 1.6, 8.0], // all ranges
  fleet: [0.4, 0.8, 1.6, 8.0],
};

/** Convoy history days available per tier */
export const TIER_HISTORY_DAYS: Record<SubscriptionTier, number> = {
  free: 7,
  pro: 365,
  fleet: 365,
};

export const PRO_MONTHLY_PRICE = "$4.99/mo";
export const PRO_ANNUAL_PRICE = "$39.99/yr";
export const FLEET_SEAT_PRICE = "$9.99/seat/mo";

// RevenueCat product IDs
export const IAP_PRODUCTS = {
  PRO_MONTHLY: "di_pro_monthly",
  PRO_ANNUAL: "di_pro_annual",
  FLEET_MONTHLY: "di_fleet_monthly",
} as const;

// ─── WebSocket event type names ───────────────────────────────────────────────

export const WS_EVENTS = {
  // Client → Server
  LOCATION_UPDATE: "location_update",
  PTT_START: "ptt_start",
  PTT_STOP: "ptt_stop",
  SET_RANGE: "set_range",
  SET_ENABLED: "set_enabled",
  REPORT_DRIVER: "report_driver",
  PING: "ping",

  // Server → Client
  ROOM_ASSIGN: "room_assign",
  ROOM_REASSIGN: "room_reassign",
  NEARBY_COUNT: "nearby_count",
  SPEAKER_START: "speaker_start",
  SPEAKER_STOP: "speaker_stop",
  DRIVER_JOINED: "driver_joined",
  DRIVER_LEFT: "driver_left",
  WAVE_RECEIVED: "wave_received",
  PONG: "pong",
} as const;
