import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSubscriptionStore } from "../store/subscriptionStore";

export function ProBadge(): React.ReactElement | null {
  const { tier } = useSubscriptionStore();
  if (tier === "free") return null;

  return (
    <View style={[styles.badge, tier === "fleet" && styles.fleet]}>
      <Text style={styles.text}>{tier === "fleet" ? "FLEET" : "PRO"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: "#0e7490",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fleet: { backgroundColor: "#7c3aed" },
  text: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
});
