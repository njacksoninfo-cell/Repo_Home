import "dotenv/config";

function required(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: parseInt(optional("PORT", "3001"), 10),
  nodeEnv: optional("NODE_ENV", "development"),

  redis: {
    url: optional("REDIS_URL", "redis://localhost:6379"),
  },

  db: {
    url: optional(
      "DATABASE_URL",
      "postgresql://diuser:dipass@localhost:5432/driver_intercom"
    ),
  },

  livekit: {
    url: optional("LIVEKIT_URL", "ws://localhost:7880"),
    apiKey: optional("LIVEKIT_API_KEY", "devkey"),
    apiSecret: optional(
      "LIVEKIT_API_SECRET",
      "devsecret0000000000000000000000"
    ),
  },

  rateLimit: {
    max: parseInt(optional("RATE_LIMIT_MAX", "100"), 10),
    windowMs: parseInt(optional("RATE_LIMIT_WINDOW_MS", "60000"), 10),
  },

  // PTT: minimum ms between transmissions per session
  pttCooldownMs: 500,

  // Stale driver: remove from geo after this many ms without a ping
  staleDriverMs: 15_000,

  // Report abuse: auto-mute after this many reports in the window
  reportMuteThreshold: 3,
  reportMuteWindowMs: 10 * 60 * 1000,
} as const;
