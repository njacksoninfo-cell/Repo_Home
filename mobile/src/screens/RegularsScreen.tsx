import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { API_BASE_URL } from "../lib/constants";
import { useSessionStore } from "../store/sessionStore";
import { VehicleBadge } from "../components/VehicleBadge";
import type { VehicleProfile } from "@proximity/shared";

interface RegularItem {
  encounteredId: string;
  encounterCount: number;
  lastSeenAt: number;
  vehicle: VehicleProfile | null;
}

export function RegularsScreen(): React.ReactElement {
  const { sessionId } = useSessionStore();
  const [regulars, setRegulars] = useState<RegularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`${API_BASE_URL}/api/regulars?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data: { regulars: RegularItem[] }) => setRegulars(data.regulars ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  const formatTime = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
      <Text style={styles.title}>Regulars</Text>
      <Text style={styles.subtitle}>Drivers you keep running into</Text>
      {regulars.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            No Regulars yet.{"\n\n"}Drive the same route a few times and familiar cars will show up here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={regulars}
          keyExtractor={(item) => item.encounteredId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {item.vehicle ? (
                <VehicleBadge vehicle={item.vehicle} />
              ) : (
                <Text style={styles.unknownVehicle}>Unknown vehicle</Text>
              )}
              <View style={styles.rowRight}>
                <Text style={styles.count}>{item.encounterCount}x</Text>
                <Text style={styles.date}>Last: {formatTime(item.lastSeenAt)}</Text>
              </View>
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
  subtitle: { color: "#64748b", fontSize: 14, paddingHorizontal: 20, paddingBottom: 16 },
  list: { padding: 16, gap: 10 },
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
  unknownVehicle: { color: "#475569", fontSize: 14 },
  rowRight: { alignItems: "flex-end", gap: 2 },
  count: { color: "#f59e0b", fontSize: 16, fontWeight: "800" },
  date: { color: "#475569", fontSize: 12 },
});
