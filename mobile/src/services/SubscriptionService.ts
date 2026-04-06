/**
 * SubscriptionService — wraps RevenueCat (react-native-purchases).
 *
 * RevenueCat handles:
 *  - StoreKit (iOS) and Google Play Billing receipt validation
 *  - Subscription lifecycle (renewals, cancellations, grace periods)
 *  - Webhooks to backend for server-side entitlement checks
 *
 * Setup in production:
 *  1. Create products in App Store Connect / Google Play Console:
 *     - di_pro_monthly ($4.99/mo)
 *     - di_pro_annual  ($39.99/yr)
 *     - di_fleet_monthly ($9.99/mo)
 *  2. Create a RevenueCat project, add iOS + Android apps
 *  3. Replace REVENUECAT_API_KEY_IOS / ANDROID below
 *  4. Set up RevenueCat → backend webhook to POST /api/subscription/validate
 */

import { Platform } from "react-native";
import { API_BASE_URL } from "../lib/constants";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useSessionStore } from "../store/sessionStore";
import type { SubscriptionTier } from "@driver-intercom/shared";
import { IAP_PRODUCTS } from "@driver-intercom/shared";

// RevenueCat API keys — replace with real keys from RevenueCat dashboard
const RC_API_KEY_IOS = "appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const RC_API_KEY_ANDROID = "goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

/**
 * Initialize RevenueCat SDK on app launch.
 * Called once in main.tsx bootstrap.
 */
export async function initSubscriptions(sessionId: string): Promise<void> {
  useSubscriptionStore.getState().setLoading(true);

  try {
    // Dynamic import so non-IAP builds don't break
    // In production: import Purchases from "react-native-purchases" at top level
    // const Purchases = (await import("react-native-purchases")).default;
    // const apiKey = Platform.OS === "ios" ? RC_API_KEY_IOS : RC_API_KEY_ANDROID;
    // await Purchases.configure({ apiKey, appUserID: sessionId });
    // const info = await Purchases.getCustomerInfo();
    // const tier = resolveRCTier(info);

    // Stub: fetch tier from our own backend
    const res = await fetch(`${API_BASE_URL}/api/subscription/status?sessionId=${sessionId}`);
    if (res.ok) {
      const data = (await res.json()) as { tier: SubscriptionTier };
      useSubscriptionStore.getState().setTier(data.tier);
    }
  } catch {
    // Non-fatal — default to free
  } finally {
    useSubscriptionStore.getState().setLoading(false);
  }
}

/**
 * Purchase a product.
 * Returns true on success, false on cancel/error.
 */
export async function purchaseProduct(productId: string): Promise<boolean> {
  const sessionId = useSessionStore.getState().sessionId;
  if (!sessionId) return false;

  try {
    // In production with RevenueCat:
    // const Purchases = (await import("react-native-purchases")).default;
    // const offerings = await Purchases.getOfferings();
    // const pkg = offerings.current?.availablePackages.find(p => p.product.identifier === productId);
    // if (!pkg) return false;
    // const { customerInfo } = await Purchases.purchasePackage(pkg);
    // const tier = resolveRCTier(customerInfo);

    // Stub: call our validation endpoint directly (for dev/testing)
    const stubReceipt = `stub_receipt_${productId}_${Date.now()}`;
    const res = await fetch(`${API_BASE_URL}/api/subscription/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        productId,
        receiptData: stubReceipt,
        platform: Platform.OS as "ios" | "android",
      }),
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { tier: SubscriptionTier };
    useSubscriptionStore.getState().setTier(data.tier);
    return true;
  } catch {
    return false;
  }
}

/** Restore previous purchases */
export async function restorePurchases(): Promise<boolean> {
  const sessionId = useSessionStore.getState().sessionId;
  if (!sessionId) return false;

  try {
    // const Purchases = (await import("react-native-purchases")).default;
    // const info = await Purchases.restorePurchases();
    // const tier = resolveRCTier(info);

    const res = await fetch(`${API_BASE_URL}/api/subscription/restore`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      const data = (await res.json()) as { tier: SubscriptionTier };
      useSubscriptionStore.getState().setTier(data.tier);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Helper to map RevenueCat entitlements to our tier
// function resolveRCTier(info: CustomerInfo): SubscriptionTier {
//   if (info.entitlements.active["fleet"]) return "fleet";
//   if (info.entitlements.active["pro"]) return "pro";
//   return "free";
// }
