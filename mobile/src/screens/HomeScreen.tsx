import React from "react";
import { View, StyleSheet, SafeAreaView } from "react-native";
import { ChannelStatusBar } from "../components/ChannelStatusBar";
import { PTTButton } from "../components/PTTButton";
import { ActiveSpeakerList } from "../components/ActiveSpeakerList";
import { RangeSelector } from "../components/RangeSelector";
import { AdBanner } from "../components/AdBanner";
import { useRoomConnection } from "../hooks/useRoomConnection";
import { useNearbyDrivers } from "../hooks/useNearbyDrivers";

export function HomeScreen(): React.ReactElement {
  // Mount connection lifecycle hooks
  useRoomConnection();
  useNearbyDrivers();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar: nearby count + on/off toggle */}
        <ChannelStatusBar />

        {/* Active speakers */}
        <View style={styles.speakers}>
          <ActiveSpeakerList />
        </View>

        {/* Center: PTT button */}
        <View style={styles.pttContainer}>
          <PTTButton />
        </View>

        {/* Bottom: range selector + contextual ad */}
        <View style={styles.bottom}>
          <RangeSelector />
          <View style={styles.adSlot}>
            <AdBanner />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0d0d0d",
  },
  container: {
    flex: 1,
    paddingTop: 12,
    gap: 16,
  },
  speakers: {
    minHeight: 60,
    justifyContent: "center",
  },
  pttContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottom: {
    paddingBottom: 24,
    gap: 12,
  },
  adSlot: {
    minHeight: 0,
  },
});
