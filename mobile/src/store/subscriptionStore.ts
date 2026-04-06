import { create } from "zustand";
import type { SubscriptionTier } from "@driver-intercom/shared";
import { TIER_RANGE_LIMITS, TIER_HISTORY_DAYS } from "@driver-intercom/shared";

interface Entitlements {
  allowedRangesKm: readonly number[];
  historyDays: number;
  adsEnabled: boolean;
  fleetAccess: boolean;
  regularNotifications: boolean;
  verifiedVehicleBadge: boolean;
}

function entitlementsFor(tier: SubscriptionTier): Entitlements {
  return {
    allowedRangesKm: TIER_RANGE_LIMITS[tier],
    historyDays: TIER_HISTORY_DAYS[tier],
    adsEnabled: tier === "free",
    fleetAccess: tier === "fleet",
    regularNotifications: tier !== "free",
    verifiedVehicleBadge: tier !== "free",
  };
}

interface SubscriptionState {
  tier: SubscriptionTier;
  entitlements: Entitlements;
  loading: boolean;
  // Actions
  setTier: (tier: SubscriptionTier) => void;
  setLoading: (v: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  tier: "free",
  entitlements: entitlementsFor("free"),
  loading: false,

  setTier: (tier) =>
    set({ tier, entitlements: entitlementsFor(tier) }),

  setLoading: (loading) => set({ loading }),
}));
