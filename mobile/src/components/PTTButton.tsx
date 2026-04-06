import React, { useRef } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  Animated,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useAudioStore } from "../store/audioStore";
import { useSessionStore } from "../store/sessionStore";
import { usePTT } from "../hooks/usePTT";

export function PTTButton(): React.ReactElement {
  const { pttActive } = useAudioStore();
  const { enabled } = useSessionStore();
  const { onPressIn, onPressOut } = usePTT();
  const scale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (!enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringOpacity, {
          toValue: 0.5,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
    onPressIn();
  };

  const handlePressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    ringOpacity.stopAnimation();
    Animated.timing(ringOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onPressOut();
  };

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: scale }],
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          style={[
            styles.button,
            pttActive && styles.buttonActive,
            !enabled && styles.buttonDisabled,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!enabled}
        >
          <Text style={styles.icon}>🎙</Text>
          <Text style={styles.label}>
            {!enabled ? "INTERCOM OFF" : pttActive ? "TRANSMITTING" : "HOLD TO TALK"}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "#22d3ee",
    backgroundColor: "transparent",
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#1e293b",
    borderWidth: 3,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonActive: {
    backgroundColor: "#164e63",
    borderColor: "#22d3ee",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 36,
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
