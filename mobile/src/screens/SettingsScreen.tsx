import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { useSessionStore } from "../store/sessionStore";
import { VehicleBadge } from "../components/VehicleBadge";
import { API_BASE_URL } from "../lib/constants";
import { clearSession } from "../services/SessionService";

interface Props {
  onEditVehicle: () => void;
}

export function SettingsScreen({ onEditVehicle }: Props): React.ReactElement {
  const { sessionId, vehicle } = useSessionStore();
  const [loadingCode, setLoadingCode] = useState(false);
  const [convoCode, setConvoCode] = useState<string | null>(null);

  const getConvoyCode = async () => {
    if (!sessionId) return;
    setLoadingCode(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/profile/code?sessionId=${sessionId}`
      );
      const data = (await res.json()) as { convoCode: string };
      setConvoCode(data.convoCode);
    } catch {
      Alert.alert("Error", "Could not generate convoy code");
    } finally {
      setLoadingCode(false);
    }
  };

  const shareConvoyCode = async () => {
    if (!convoCode) return;
    await Share.share({
      message: `Connect with me on Driver Intercom! My convoy code: ${convoCode}\n\nDownload: https://driverintercom.app`,
    });
  };

  const confirmClearSession = () => {
    Alert.alert(
      "Reset Session",
      "This will clear your session ID and vehicle profile. Your encounter history in the app will be lost. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearSession();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        {/* Vehicle profile */}
        <Text style={styles.sectionLabel}>Your Vehicle</Text>
        <View style={styles.card}>
          {vehicle ? (
            <VehicleBadge vehicle={vehicle} />
          ) : (
            <Text style={styles.muted}>No vehicle set</Text>
          )}
          <Pressable style={styles.editBtn} onPress={onEditVehicle}>
            <Text style={styles.editBtnText}>Edit Vehicle</Text>
          </Pressable>
        </View>

        {/* Convoy code */}
        <Text style={styles.sectionLabel}>Convoy Code</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Share your convoy code with someone to connect outside of a drive session.
          </Text>
          {convoCode ? (
            <>
              <Text style={styles.code}>{convoCode}</Text>
              <Pressable style={styles.btn} onPress={shareConvoyCode}>
                <Text style={styles.btnText}>Share Code</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.btn} onPress={getConvoyCode} disabled={loadingCode}>
              {loadingCode ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Generate Code</Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Your session ID is anonymous and not linked to any account. Your GPS coordinates are never shared with other drivers — only approximate distance and direction.
          </Text>
          <Pressable style={styles.dangerBtn} onPress={confirmClearSession}>
            <Text style={styles.dangerBtnText}>Reset Session</Text>
          </Pressable>
        </View>

        <Text style={styles.sessionId} numberOfLines={1}>
          Session: {sessionId?.slice(0, 8)}...
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  container: { padding: 24, gap: 12, paddingBottom: 48 },
  title: { color: "#f1f5f9", fontSize: 24, fontWeight: "800" },
  sectionLabel: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  muted: { color: "#475569", fontSize: 15 },
  cardDesc: { color: "#64748b", fontSize: 14, lineHeight: 20 },
  editBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  editBtnText: { color: "#94a3b8", fontSize: 14 },
  code: {
    color: "#22d3ee",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 6,
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#0e7490",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "#7f1d1d",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  dangerBtnText: { color: "#ef4444", fontSize: 14 },
  sessionId: { color: "#1e293b", fontSize: 11, textAlign: "center", marginTop: 8 },
});
