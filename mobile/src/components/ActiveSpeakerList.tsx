import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAudioStore } from "../store/audioStore";
import { VehicleBadge } from "./VehicleBadge";
import { bearingToCompass, formatDistance } from "../lib/geoUtils";
import { vehicleDisplayName } from "@driver-intercom/shared";

export function ActiveSpeakerList(): React.ReactElement | null {
  const { activeSpeakers } = useAudioStore();
  if (activeSpeakers.length === 0) return null;

  return (
    <View style={styles.container}>
      {activeSpeakers.map((speaker) => (
        <View key={speaker.sessionId} style={styles.row}>
          <View style={styles.speakerDot} />
          <VehicleBadge vehicle={speaker.vehicle} size="sm" />
          {speaker.distanceMi !== null && (
            <Text style={styles.distance}>
              {formatDistance(speaker.distanceMi)}
              {speaker.bearingDeg !== null
                ? ` ${bearingToCompass(speaker.bearingDeg)}`
                : ""}
            </Text>
          )}
          {speaker.isRegular && <Text style={styles.regularBadge}>Regular</Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  speakerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22d3ee",
  },
  distance: {
    color: "#64748b",
    fontSize: 12,
  },
  regularBadge: {
    color: "#f59e0b",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
