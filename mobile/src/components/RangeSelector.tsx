import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RANGE_OPTIONS_KM, RANGE_LABELS, type RangeKm } from "@driver-intercom/shared";
import { useSessionStore } from "../store/sessionStore";
import { wsService } from "../services/WebSocketService";

export function RangeSelector(): React.ReactElement {
  const { rangeKm, setRangeKm } = useSessionStore();

  const handleSelect = (r: RangeKm) => {
    setRangeKm(r);
    wsService.send({ type: "set_range", payload: { rangeKm: r } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Range</Text>
      <View style={styles.options}>
        {RANGE_OPTIONS_KM.map((r) => (
          <Pressable
            key={r}
            style={[styles.option, rangeKm === r && styles.optionActive]}
            onPress={() => handleSelect(r)}
          >
            <Text style={[styles.optionText, rangeKm === r && styles.optionTextActive]}>
              {RANGE_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  options: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  optionActive: {
    backgroundColor: "#0e7490",
  },
  optionText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  optionTextActive: {
    color: "#fff",
  },
});
