import type { ContextualAd, AdCategory } from "@proximity/shared";
import { v4 as uuidv4 } from "uuid";
import { query } from "../db/pgClient";

/**
 * Ad inventory — in production, this would be fetched from an ad server / DSP.
 * Each entry represents a partner campaign.
 */
const AD_INVENTORY: Omit<ContextualAd, "id" | "subtext">[] = [
  // Fuel
  { advertiser: "Shell", headline: "$0.10 off per gallon", category: "fuel", ctaLabel: "Get Deal", ctaUrl: "https://shell.com/motorist", logoEmoji: "⛽" },
  { advertiser: "BP", headline: "BPme Rewards — earn points every fill-up", category: "fuel", ctaLabel: "Join Free", ctaUrl: "https://bpme.bp.com", logoEmoji: "⛽" },
  { advertiser: "Chevron", headline: "Techron fuel — cleaner engine", category: "fuel", ctaLabel: "Find Station", ctaUrl: "https://chevron.com", logoEmoji: "⛽" },

  // Auto parts
  { advertiser: "AutoZone", headline: "Free battery test & install", category: "auto_parts", ctaLabel: "Find Store", ctaUrl: "https://autozone.com", logoEmoji: "🔧" },
  { advertiser: "O'Reilly Auto", headline: "Same-day parts delivery available", category: "auto_parts", ctaLabel: "Order Now", ctaUrl: "https://oreillyauto.com", logoEmoji: "🔧" },
  { advertiser: "Advance Auto Parts", headline: "20% off with code DRIVER20", category: "auto_parts", ctaLabel: "Shop Now", ctaUrl: "https://advanceautoparts.com", logoEmoji: "🔧" },

  // Auto service
  { advertiser: "Jiffy Lube", headline: "Oil change from $34.99 — no appointment", category: "auto_service", ctaLabel: "Find Location", ctaUrl: "https://jiffylube.com", logoEmoji: "🛠" },
  { advertiser: "Midas", headline: "Free brake inspection today", category: "auto_service", ctaLabel: "Book Now", ctaUrl: "https://midas.com", logoEmoji: "🛠" },
  { advertiser: "Pep Boys", headline: "Tire rotation + inspection — $19.99", category: "auto_service", ctaLabel: "Schedule", ctaUrl: "https://pepboys.com", logoEmoji: "🛠" },

  // Insurance
  { advertiser: "Progressive", headline: "Drivers save avg. $799/yr switching", category: "insurance", ctaLabel: "Get Quote", ctaUrl: "https://progressive.com", logoEmoji: "🛡" },
  { advertiser: "Geico", headline: "15 min could save 15%+", category: "insurance", ctaLabel: "Get Quote", ctaUrl: "https://geico.com", logoEmoji: "🛡" },
  { advertiser: "State Farm", headline: "Bundle home + auto and save", category: "insurance", ctaLabel: "Get Quote", ctaUrl: "https://statefarm.com", logoEmoji: "🛡" },

  // Drive-thru food
  { advertiser: "Dunkin'", headline: "Mobile order — skip the line", category: "food_drive_thru", ctaLabel: "Order Ahead", ctaUrl: "https://dunkindonuts.com", logoEmoji: "☕" },
  { advertiser: "McDonald's", headline: "$1 any size coffee through the app", category: "food_drive_thru", ctaLabel: "Order Now", ctaUrl: "https://mcdonalds.com", logoEmoji: "🍔" },
  { advertiser: "Chick-fil-A", headline: "Earn points with every purchase", category: "food_drive_thru", ctaLabel: "Join Rewards", ctaUrl: "https://chick-fil-a.com", logoEmoji: "🐔" },

  // EV charging
  { advertiser: "ChargePoint", headline: "Find a fast charger near you", category: "ev_charging", ctaLabel: "Open App", ctaUrl: "https://chargepoint.com", logoEmoji: "⚡" },
  { advertiser: "Tesla Supercharger", headline: "Free V3 Supercharging available nearby", category: "ev_charging", ctaLabel: "Navigate", ctaUrl: "https://tesla.com/supercharger", logoEmoji: "⚡" },
];

function getTimeBasedCategory(): AdCategory {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return "food_drive_thru"; // morning commute → coffee
  if (hour >= 11 && hour < 14) return "food_drive_thru"; // lunch
  if (hour >= 16 && hour < 19) return "fuel"; // evening commute → gas
  return "auto_parts"; // default
}

function getVehicleBasedCategory(make: string | null): AdCategory | null {
  if (!make) return null;
  const evBrands = ["Tesla", "Rivian", "Lucid", "Polestar", "Chevrolet Bolt"];
  if (evBrands.some((b) => make.includes(b))) return "ev_charging";
  return null;
}

/**
 * Select the best contextual ad for a driver based on their vehicle and time of day.
 * In production: integrate with a DSP (e.g., Google AdX, Xandr) using lat/lng to
 * target nearby physical locations. CPMs for automotive/location ads: $15–30.
 */
export function selectContextualAd(
  vehicleMake: string | null,
  lat: number,
  lng: number
): ContextualAd {
  // Priority: vehicle-specific > time-based > random
  const vehicleCat = getVehicleBasedCategory(vehicleMake);
  const timeCat = getTimeBasedCategory();
  const targetCategory = vehicleCat ?? timeCat;

  const pool = AD_INVENTORY.filter((a) => a.category === targetCategory);
  const ad = pool[Math.floor(Math.random() * pool.length)] ?? AD_INVENTORY[0];

  // In production, subtext would include actual nearby location data
  // e.g., from Google Places API: "Exit 14 · 0.3 mi ahead"
  const subtextMap: Record<AdCategory, string> = {
    fuel: "Tap to find the nearest location",
    auto_parts: "Open today · Tap to navigate",
    auto_service: "No appointment needed · Tap for details",
    insurance: "Takes 2 minutes · No commitment",
    food_drive_thru: "Order ahead — skip the line",
    ev_charging: "Available stalls nearby · Tap to navigate",
  };

  return {
    ...ad,
    id: uuidv4(),
    subtext: subtextMap[ad.category],
  };
}

/** Record that an ad was shown (for analytics + billing) */
export async function recordImpression(
  sessionId: string,
  ad: ContextualAd
): Promise<void> {
  await query(
    `INSERT INTO ad_impressions (session_id, ad_id, advertiser, category, shown_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, ad.id, ad.advertiser, ad.category, Date.now()]
  );
}

/** Record that an ad was clicked */
export async function recordClick(
  sessionId: string,
  adId: string
): Promise<void> {
  await query(
    `UPDATE ad_impressions SET clicked = TRUE
     WHERE session_id = $1 AND ad_id = $2 AND shown_at > $3`,
    [sessionId, adId, Date.now() - 60_000 * 10] // within last 10 min
  );
}
