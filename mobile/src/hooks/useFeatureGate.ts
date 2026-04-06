import { useSubscriptionStore } from "../store/subscriptionStore";
import type { RangeKm } from "@proximity/shared";

/** Returns true if the current tier allows the given range */
export function useRangeAllowed(rangeKm: RangeKm): boolean {
  const { entitlements } = useSubscriptionStore();
  return entitlements.allowedRangesKm.includes(rangeKm);
}

/** Returns true if the user can view full convoy history (unlimited days) */
export function useFullHistoryAllowed(): boolean {
  const { entitlements } = useSubscriptionStore();
  return entitlements.historyDays >= 365;
}

/** Returns true if ads should be shown */
export function useAdsEnabled(): boolean {
  const { entitlements } = useSubscriptionStore();
  return entitlements.adsEnabled;
}

/** Returns true if fleet features are accessible */
export function useFleetAccess(): boolean {
  const { entitlements } = useSubscriptionStore();
  return entitlements.fleetAccess;
}

/** Returns true if the user is on a paid tier */
export function useIsPro(): boolean {
  const { tier } = useSubscriptionStore();
  return tier !== "free";
}
