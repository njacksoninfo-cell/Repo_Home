import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { RANGE_OPTIONS_KM, RANGE_LABELS, type RangeKm } from "@proximity/shared";
import { useSessionStore } from "../store/sessionStore";
import { wsService } from "../services/WebSocketService";
import { useRangeAllowed, useIsPro } from "../hooks/useFeatureGate";
import { PaywallModal } from "./PaywallModal";

export function RangeSelector(): React.ReactElement {
  const { rangeKm, setRangeKm } = useSessionStore();
  const isPro = useIsPro();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleSelect = (r: RangeKm) => {
    const allowed = isPro || r === 0.4 || r === 0.8;
    if (!allowed) {
      setShowPaywall(true);
      return;
    }
    setRangeKm(r);
    wsService.send({ type: "set_range", payload: { rangeKm: r } });
  };

  return (
    <>
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureHint="Extended range (1 mi, 5 mi) requires Pro"
      />
      <View style={styles.container}>
        <Text style={styles.label}>Range</Text>
        <View style={styles.options}>
          {RANGE_OPTIONS_KM.map((r) => {
            const locked = !isPro && r !== 0.4 && r !== 0.8;
            return (
              <Pressable
                key={r}
                style={[styles.option, rangeKm === r && styles.optionActive, locked && styles.optionLocked]}
                onPress={() => handleSelect(r)}
              >
                <Text style={[styles.optionText, rangeKm === r && styles.optionTextActive]}>
                  {RANGE_LABELS[r]}
                  {locked ? " 🔒" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
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
  optionLocked: {
    opacity: 0.5,
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
