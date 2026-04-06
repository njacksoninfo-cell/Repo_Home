import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { useChannelStore } from "../store/channelStore";
import { useSessionStore } from "../store/sessionStore";
import { wsService } from "../services/WebSocketService";
import { RANGE_LABELS } from "@proximity/shared";

export function ChannelStatusBar(): React.ReactElement {
  const { nearbyCount } = useChannelStore();
  const { enabled, rangeKm, setEnabled } = useSessionStore();

  const toggleEnabled = (val: boolean) => {
    setEnabled(val);
    wsService.send({ type: "set_enabled", payload: { enabled: val } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.dot, enabled ? styles.dotActive : styles.dotOff]} />
        <Text style={styles.count}>
          {enabled ? `${nearbyCount} nearby` : "Off"}
        </Text>
        <Text style={styles.range}>{RANGE_LABELS[rangeKm]}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={toggleEnabled}
        trackColor={{ false: "#334155", true: "#0e7490" }}
        thumbColor={enabled ? "#22d3ee" : "#94a3b8"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    marginHorizontal: 16,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#22c55e",
  },
  dotOff: {
    backgroundColor: "#475569",
  },
  count: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "600",
  },
  range: {
    color: "#64748b",
    fontSize: 13,
  },
});
