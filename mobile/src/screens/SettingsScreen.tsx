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
  TextInput,
  Linking,
} from "react-native";
import { useSessionStore } from "../store/sessionStore";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { VehicleBadge } from "../components/VehicleBadge";
import { ProBadge } from "../components/ProBadge";
import { PaywallModal } from "../components/PaywallModal";
import { API_BASE_URL } from "../lib/constants";
import { clearSession } from "../services/SessionService";

const INSURANCE_PARTNERS = [
  { id: "progressive", name: "Progressive", color: "#0066cc" },
  { id: "geico", name: "Geico", color: "#00a651" },
  { id: "statefarm", name: "State Farm", color: "#cc0000" },
] as const;

interface Props {
  onEditVehicle: () => void;
}

export function SettingsScreen({ onEditVehicle }: Props): React.ReactElement {
  const { sessionId, vehicle } = useSessionStore();
  const { tier } = useSubscriptionStore();
  const [loadingCode, setLoadingCode] = useState(false);
  const [convoCode, setConvoCode] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [zipCode, setZipCode] = useState("");
  const [loadingLead, setLoadingLead] = useState<string | null>(null);

  const isPro = tier !== "free";

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

  const handleGetQuote = async (partnerId: string) => {
    if (!sessionId || !zipCode.trim()) {
      Alert.alert("Zip code required", "Enter your zip code to get a personalized quote.");
      return;
    }
    setLoadingLead(partnerId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          partnerId,
          zipCode: zipCode.trim(),
          vehicleYear: vehicle?.year ?? null,
          vehicleMake: vehicle?.make ?? null,
          vehicleModel: vehicle?.model ?? null,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { affiliateUrl: string };
        await Linking.openURL(data.affiliateUrl);
      }
    } catch {
      Alert.alert("Error", "Could not open quote page.");
    } finally {
      setLoadingLead(null);
    }
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

  const tierLabel = tier === "fleet" ? "Fleet" : tier === "pro" ? "Pro" : "Free";
  const tierColor = tier === "fleet" ? "#7c3aed" : tier === "pro" ? "#0e7490" : "#334155";

  return (
    <SafeAreaView style={styles.safe}>
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        {/* Subscription status */}
        <Text style={styles.sectionLabel}>Subscription</Text>
        <View style={styles.card}>
          <View style={styles.subRow}>
            <View style={[styles.tierPill, { backgroundColor: tierColor }]}>
              <Text style={styles.tierPillText}>{tierLabel.toUpperCase()}</Text>
            </View>
            <Text style={styles.tierDesc}>
              {tier === "free"
                ? "Limited to 0.5 mi range · 7-day history · Ads shown"
                : tier === "pro"
                ? "All ranges · 365-day history · No ads · Create fleets"
                : "Fleet tier · All Pro features + fleet management"}
            </Text>
          </View>
          {!isPro && (
            <Pressable style={styles.btn} onPress={() => setShowPaywall(true)}>
              <Text style={styles.btnText}>Upgrade to Pro — $4.99/mo</Text>
            </Pressable>
          )}
        </View>

        {/* Vehicle profile */}
        <Text style={styles.sectionLabel}>Your Vehicle</Text>
        <View style={styles.card}>
          <View style={styles.vehicleRow}>
            {vehicle ? (
              <VehicleBadge vehicle={vehicle} />
            ) : (
              <Text style={styles.muted}>No vehicle set</Text>
            )}
            <ProBadge />
          </View>
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

        {/* Insurance quotes */}
        <Text style={styles.sectionLabel}>Auto Insurance</Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Get a quote for your{vehicle ? ` ${vehicle.color} ${vehicle.make} ${vehicle.model}` : " vehicle"}.
            Compare rates from top providers.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Your zip code"
            placeholderTextColor="#475569"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
            maxLength={5}
          />
          <View style={styles.partnerRow}>
            {INSURANCE_PARTNERS.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.partnerBtn, { borderColor: p.color }]}
                onPress={() => handleGetQuote(p.id)}
                disabled={loadingLead !== null}
              >
                {loadingLead === p.id ? (
                  <ActivityIndicator size="small" color={p.color} />
                ) : (
                  <Text style={[styles.partnerBtnText, { color: p.color }]}>{p.name}</Text>
                )}
              </Pressable>
            ))}
          </View>
          <Text style={styles.cardDisclaimer}>
            Rates vary by location and driving history. We may receive a referral fee.
          </Text>
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
  subRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tierPill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierPillText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  tierDesc: { color: "#64748b", fontSize: 13, flex: 1 },
  vehicleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  muted: { color: "#475569", fontSize: 15 },
  cardDesc: { color: "#64748b", fontSize: 14, lineHeight: 20 },
  cardDisclaimer: { color: "#334155", fontSize: 11, lineHeight: 16 },
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
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 12,
    color: "#f1f5f9",
    fontSize: 15,
  },
  partnerRow: { flexDirection: "row", gap: 8 },
  partnerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  partnerBtnText: { fontSize: 13, fontWeight: "700" },
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
