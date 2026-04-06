import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL } from "../lib/constants";
import { useSessionStore } from "../store/sessionStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { VehicleBadge } from "../components/VehicleBadge";
import { PaywallModal } from "../components/PaywallModal";
import type { VehicleProfile } from "@driver-intercom/shared";
import { TIER_HISTORY_DAYS } from "@driver-intercom/shared";

interface EncounterItem {
  encounteredId: string;
  durationSeconds: number;
  lastSeenAt: number;
  vehicle: VehicleProfile | null;
}

export function ConvoyHistoryScreen(): React.ReactElement {
  const { sessionId } = useSessionStore();
  const { tier } = useSubscriptionStore();
  const [encounters, setEncounters] = useState<EncounterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [waved, setWaved] = useState<Set<string>>(new Set());
  const [showPaywall, setShowPaywall] = useState(false);

  const historyDays = TIER_HISTORY_DAYS[tier] ?? 7;
  const isFullHistory = historyDays >= 365;

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_BASE_URL}/api/convoy/recent?sessionId=${sessionId}&days=${historyDays}`)
      .then((r) => r.json())
      .then((data: { encounters: EncounterItem[] }) => setEncounters(data.encounters ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId, historyDays]);

  const handleWave = async (targetId: string) => {
    if (!sessionId || waved.has(targetId)) return;
    setWaved((prev) => new Set([...prev, targetId]));
    await fetch(`${API_BASE_URL}/api/wave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, targetSessionId: targetId }),
    });
  };

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    return `${Math.round(secs / 60)}m`;
  };

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color="#22d3ee" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureHint="Full convoy history (365 days) requires Pro"
      />
      <Text style={styles.title}>Your Convoy</Text>
      <Text style={styles.subtitle}>Drivers you rode near recently</Text>

      {!isFullHistory && (
        <Pressable style={styles.upsellBanner} onPress={() => setShowPaywall(true)}>
          <View style={styles.upsellInner}>
            <Text style={styles.upsellTitle}>Showing last {historyDays} days</Text>
            <Text style={styles.upsellDesc}>Upgrade to Pro for full 365-day history →</Text>
          </View>
        </Pressable>
      )}

      {encounters.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No encounters yet.{"\n"}Turn on the intercom and drive!</Text>
        </View>
      ) : (
        <FlatList
          data={encounters}
          keyExtractor={(item) => item.encounteredId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                {item.vehicle ? (
                  <VehicleBadge vehicle={item.vehicle} />
                ) : (
                  <Text style={styles.unknownVehicle}>Unknown vehicle</Text>
                )}
                <Text style={styles.meta}>
                  {formatDuration(item.durationSeconds)} · {formatTime(item.lastSeenAt)}
                </Text>
              </View>
              <Pressable
                style={[styles.waveBtn, waved.has(item.encounteredId) && styles.waveBtnDone]}
                onPress={() => handleWave(item.encounteredId)}
                disabled={waved.has(item.encounteredId)}
              >
                <Text style={styles.waveBtnText}>
                  {waved.has(item.encounteredId) ? "Waved 👋" : "Wave"}
                </Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  title: { color: "#f1f5f9", fontSize: 24, fontWeight: "800", padding: 20, paddingBottom: 4 },
  subtitle: { color: "#64748b", fontSize: 14, paddingHorizontal: 20, paddingBottom: 12 },
  upsellBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(14,116,144,0.15)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#0e7490",
    padding: 12,
  },
  upsellInner: { gap: 2 },
  upsellTitle: { color: "#22d3ee", fontSize: 13, fontWeight: "700" },
  upsellDesc: { color: "#64748b", fontSize: 12 },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { color: "#475569", fontSize: 16, textAlign: "center", lineHeight: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
  },
  rowLeft: { gap: 6, flex: 1 },
  unknownVehicle: { color: "#475569", fontSize: 14 },
  meta: { color: "#475569", fontSize: 12 },
  waveBtn: {
    backgroundColor: "#0e7490",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  waveBtnDone: { backgroundColor: "rgba(255,255,255,0.08)" },
  waveBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
