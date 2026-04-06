import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { VehicleProfile } from "@driver-intercom/shared";
import { vehicleDisplayName } from "@driver-intercom/shared";

const COLOR_MAP: Record<string, string> = {
  Red: "#ef4444",
  Blue: "#3b82f6",
  Silver: "#94a3b8",
  Gray: "#6b7280",
  Black: "#1f2937",
  White: "#f1f5f9",
  Yellow: "#eab308",
  Green: "#22c55e",
  Orange: "#f97316",
  Brown: "#92400e",
  Purple: "#a855f7",
  Gold: "#f59e0b",
  Beige: "#d4b896",
};

interface Props {
  vehicle: VehicleProfile;
  size?: "sm" | "md";
}

export function VehicleBadge({ vehicle, size = "md" }: Props): React.ReactElement {
  const dotColor = COLOR_MAP[vehicle.color] ?? "#94a3b8";
  const name = vehicleDisplayName(vehicle);

  return (
    <View style={[styles.container, size === "sm" && styles.sm]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, size === "sm" && styles.textSm]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    color: "#f1f5f9",
    fontSize: 14,
    fontWeight: "600",
  },
  textSm: {
    fontSize: 12,
  },
});
