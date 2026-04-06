import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Alert,
} from "react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import { Platform } from "react-native";

interface Props {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: Props): React.ReactElement {
  const [step, setStep] = useState<"intro" | "mic" | "location" | "done">("intro");

  const requestMic = async () => {
    const permission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const result = await request(permission);
    if (result === RESULTS.GRANTED) {
      setStep("location");
    } else {
      Alert.alert(
        "Microphone Required",
        "Driver Intercom needs microphone access to let you talk with nearby drivers. Please enable it in Settings.",
        [{ text: "OK" }]
      );
    }
  };

  const requestLocation = async () => {
    // Request "always" location for background tracking
    const permission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.LOCATION_ALWAYS
        : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION;

    const result = await request(permission);
    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
      setStep("done");
      onComplete();
    } else {
      Alert.alert(
        "Location Required",
        "Driver Intercom needs background location to find nearby drivers even when the app is in the background. Please enable it in Settings.",
        [{ text: "OK" }]
      );
    }
  };

  if (step === "intro") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.title}>Driver Intercom</Text>
          <Text style={styles.subtitle}>
            Talk to nearby drivers like a CB radio.{"\n"}Tap, hold, and speak.
          </Text>
          <Text style={styles.body}>
            To get started, we need two permissions:{"\n\n"}
            • Microphone — to transmit your voice{"\n"}
            • Location (Always) — to find drivers near you
          </Text>
          <Pressable style={styles.btn} onPress={() => setStep("mic")}>
            <Text style={styles.btnText}>Get Started</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "mic") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.emoji}>🎙</Text>
          <Text style={styles.title}>Microphone Access</Text>
          <Text style={styles.body}>
            Required to broadcast your voice to nearby drivers when you hold the PTT button.
          </Text>
          <Pressable style={styles.btn} onPress={requestMic}>
            <Text style={styles.btnText}>Allow Microphone</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.title}>Location Access</Text>
        <Text style={styles.body}>
          Required to find drivers near you even when the app is in the background.{"\n\n"}
          Your precise location is never shared with other drivers — only your approximate distance and direction.
        </Text>
        <Pressable style={styles.btn} onPress={requestLocation}>
          <Text style={styles.btnText}>Allow Location</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  container: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    gap: 20,
  },
  emoji: { fontSize: 48, textAlign: "center" },
  title: {
    color: "#f1f5f9",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 26,
  },
  body: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 24,
  },
  btn: {
    backgroundColor: "#0e7490",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
