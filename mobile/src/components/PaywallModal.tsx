import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { purchaseProduct, restorePurchases } from "../services/SubscriptionService";
import { IAP_PRODUCTS, PRO_MONTHLY_PRICE, PRO_ANNUAL_PRICE } from "@proximity/shared";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** The locked feature that triggered the paywall */
  featureHint?: string;
}

export function PaywallModal({ visible, onClose, featureHint }: Props): React.ReactElement {
  const [selected, setSelected] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    const productId =
      selected === "annual" ? IAP_PRODUCTS.PRO_ANNUAL : IAP_PRODUCTS.PRO_MONTHLY;
    const success = await purchaseProduct(productId);
    setLoading(false);
    if (success) onClose();
  };

  const handleRestore = async () => {
    setRestoring(true);
    await restorePurchases();
    setRestoring(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        {/* Header */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.badge}>PRO</Text>
        <Text style={styles.title}>Unlock Proximity Pro</Text>

        {featureHint && (
          <Text style={styles.hint}>"{featureHint}" requires Pro</Text>
        )}

        {/* Feature list */}
        <View style={styles.features}>
          {[
            ["📡", "All 4 ranges", "Talk to drivers up to 5 miles away"],
            ["📅", "Full convoy history", "365 days of drive encounters"],
            ["⭐", "Regular notifications", "Get notified when a Regular is nearby"],
            ["✅", "Verified vehicle badge", "Stand out in the channel"],
            ["🚫", "Ad-free experience", "No ads, ever"],
            ["🚗", "Create car clubs & fleets", "Private channels for your crew"],
          ].map(([icon, title, desc]) => (
            <View key={title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.plans}>
          <Pressable
            style={[styles.plan, selected === "annual" && styles.planSelected]}
            onPress={() => setSelected("annual")}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>BEST VALUE</Text>
            </View>
            <Text style={styles.planPrice}>{PRO_ANNUAL_PRICE}</Text>
            <Text style={styles.planPer}>billed annually · saves 33%</Text>
          </Pressable>

          <Pressable
            style={[styles.plan, selected === "monthly" && styles.planSelected]}
            onPress={() => setSelected("monthly")}
          >
            <Text style={styles.planPrice}>{PRO_MONTHLY_PRICE}</Text>
            <Text style={styles.planPer}>billed monthly</Text>
          </Pressable>
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.cta, loading && styles.ctaDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>
              Start Pro — {selected === "annual" ? PRO_ANNUAL_PRICE : PRO_MONTHLY_PRICE}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={handleRestore} disabled={restoring}>
          <Text style={styles.restore}>
            {restoring ? "Restoring..." : "Restore purchases"}
          </Text>
        </Pressable>

        <Text style={styles.legal}>
          Payment charged to your App Store / Google Play account. Cancel anytime in your account settings.
        </Text>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: "#0d0d0d" },
  content: { padding: 24, paddingBottom: 48, gap: 16 },
  closeBtn: { alignSelf: "flex-end", padding: 4 },
  closeBtnText: { color: "#475569", fontSize: 18 },
  badge: {
    alignSelf: "center",
    backgroundColor: "#0e7490",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  title: {
    color: "#f1f5f9",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  hint: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  features: { gap: 14, marginVertical: 8 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  featureIcon: { fontSize: 22, width: 28, textAlign: "center" },
  featureText: { flex: 1, gap: 2 },
  featureTitle: { color: "#f1f5f9", fontSize: 15, fontWeight: "700" },
  featureDesc: { color: "#64748b", fontSize: 13 },
  plans: { flexDirection: "row", gap: 10 },
  plan: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  planSelected: { borderColor: "#22d3ee", backgroundColor: "rgba(14,116,144,0.2)" },
  planBadge: {
    backgroundColor: "#0e7490",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  planBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  planPrice: { color: "#f1f5f9", fontSize: 20, fontWeight: "800" },
  planPer: { color: "#64748b", fontSize: 12 },
  cta: {
    backgroundColor: "#0e7490",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  restore: { color: "#475569", fontSize: 14, textAlign: "center" },
  legal: { color: "#1e293b", fontSize: 11, textAlign: "center", lineHeight: 16 },
});
