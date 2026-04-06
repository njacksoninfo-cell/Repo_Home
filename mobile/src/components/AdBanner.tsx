import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL } from "../lib/constants";
import { useSessionStore } from "../store/sessionStore";
import { useAdsEnabled } from "../hooks/useFeatureGate";
import type { ContextualAd } from "@proximity/shared";

const AD_REFRESH_MS = 5 * 60 * 1000; // refresh every 5 minutes

export function AdBanner(): React.ReactElement | null {
  const adsEnabled = useAdsEnabled();
  const { sessionId } = useSessionStore();
  const [ad, setAd] = useState<ContextualAd | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchAd = useCallback(async () => {
    if (!sessionId || !adsEnabled) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ads/contextual?sessionId=${sessionId}`);
      if (res.status === 204) { setAd(null); return; } // paid user
      if (res.ok) {
        const data = (await res.json()) as { ad: ContextualAd };
        setAd(data.ad);
        setDismissed(false);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [sessionId, adsEnabled]);

  useEffect(() => {
    fetchAd();
    const interval = setInterval(fetchAd, AD_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchAd]);

  if (!adsEnabled || dismissed || (!ad && !loading)) return null;

  if (loading && !ad) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#475569" />
      </View>
    );
  }

  if (!ad) return null;

  const handleTap = async () => {
    // Record click
    fetch(`${API_BASE_URL}/api/ads/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, adId: ad.id }),
    }).catch(() => {});

    await Linking.openURL(ad.ctaUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.logo}>{ad.logoEmoji}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.advertiser}>{ad.advertiser}</Text>
          <Text style={styles.headline} numberOfLines={1}>{ad.headline}</Text>
          <Text style={styles.subtext} numberOfLines={1}>{ad.subtext}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Pressable style={styles.cta} onPress={handleTap}>
          <Text style={styles.ctaText}>{ad.ctaLabel}</Text>
        </Pressable>
        <Pressable onPress={() => setDismissed(true)} hitSlop={8}>
          <Text style={styles.dismiss}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    minHeight: 52,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  logo: { fontSize: 22 },
  textBlock: { flex: 1, gap: 1 },
  advertiser: { color: "#475569", fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  headline: { color: "#cbd5e1", fontSize: 13, fontWeight: "600" },
  subtext: { color: "#475569", fontSize: 11 },
  right: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 8 },
  cta: {
    backgroundColor: "#0e7490",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ctaText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  dismiss: { color: "#334155", fontSize: 14 },
});
